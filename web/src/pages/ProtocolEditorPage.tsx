import React, { useState } from 'react';
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { createEditor, Node } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { Protocol, SectionDefinition } from '../models/protocol';
import { auth0State, errorsState } from '../state/atoms';
import { protocolQuery, upsertProtocol, upsertRun, userQuery } from '../state/selectors';
import * as uuid from 'uuid';
import { CheckCircle, Share } from 'react-bootstrap-icons';
import moment from 'moment';
import { deserializeSlate, serializeSlate } from '../slate';
import { Block } from '../models/block';
import { SharingModal } from '../components/SharingModal';
import { Run, Section } from '../models/run';
import { Element, Leaf, onHotkeyDown, Toolbar } from '../components/Slate';
import { FetchError } from '../state/api';
import { Draggable } from '../components/Draggable';
import { ProtocolSectionEditor } from '../components/ProtocolSectionEditor';

const initialSlateValue: Node[] = [
    {
        type: 'paragraph',
        children: [
            { text: '' }
        ],
    }
];

export interface ProtocolEditorPageParams {
    id: string;
}

export function ProtocolEditorPage() {
    const history = useHistory();
    const [protocolTimestamp, setProtocolTimestamp] = useState("");
    const [showSharingModal, setShowSharingModal] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [description, setDescription] = useState<Node[] | null>(null);
    const [sections, setSections] = useState<SectionDefinition[] | null>(null);
    const [signature] = useState<string | null>(null);
    const [witness] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const editor = React.useMemo(() => withReact(createEditor()), []);
    const { id } = useParams<ProtocolEditorPageParams>();
    const [userTimestamp] = useState("");
    const { user: auth0User } = useRecoilValue(auth0State);
    const loggedInUser = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));
    const protocol = useRecoilValue(protocolQuery({ protocolId: parseInt(id), queryTime: protocolTimestamp }));
    const [errors, setErrors] = useRecoilState(errorsState);
    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (protocol: Protocol) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertProtocol(() => auth0Client, protocol);
        } catch (e) {
            if (e instanceof FetchError) {
                const err: FetchError = e;
                setErrors({
                    ...errors,
                    errors: [...(errors.errors || []), err],
                });
            }
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
            setProtocolTimestamp(moment().format());
            // setName(null);
            // setDescription(null);
            // setBlocks(null);
        }
    });
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });

    const currentName = React.useMemo(() => ((name !== null) ? name : (protocol && protocol.name)) || '', [name, protocol]);
    const currentDescription = React.useMemo(() => ((description !== null) ? description : (protocol && protocol.description && deserializeSlate(protocol.description))) || initialSlateValue, [description, protocol]);
    const currentSections = React.useMemo(() => ((sections !== null) ? sections : (protocol && protocol.sections)) || [], [sections, protocol]);
    const currentSignature = React.useMemo(() => ((signature !== null) ? signature : (protocol && protocol.signature)) || '', [signature, protocol]);
    const currentWitness = React.useMemo(() => ((witness !== null) ? witness : (protocol && protocol.witness)) || '', [witness, protocol]);

    const addSection = (section?: SectionDefinition) => {
        if (section) {
            setSections([...currentSections, section]);
        }
    }
    const updateSection = (section?: SectionDefinition) => {
        if (section) {
            setSections(currentSections.map(b => (b.id === section.id) ? section : b));
        }
    };
    const moveSection = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragSection = currentSections[dragIndex]
            const newSections = [...currentSections];
            newSections.splice(dragIndex, 1);
            newSections.splice(hoverIndex, 0, dragSection);
            setSections(newSections);
        },
        [currentSections],
    )
    const deleteSection = (sectionId?: string) => {
        if (sectionId) {
            setSections(currentSections.filter(b => b.id !== sectionId));
        }
    }

    const isSigned = (protocol && !!protocol.signedOn) || false;
    const isWitnessed = (protocol && !!protocol.witnessedOn) || false;

    // Slate helpers.
    const renderElement = React.useCallback(props => <Element {...props} />, []);
    const renderLeaf = React.useCallback(props => <Leaf {...props} />, []);

    const syncProtocol = (override?: Protocol) => {
        const newProtocol: Protocol = Object.assign({
            id: parseInt(id),
            name: currentName,
            description: serializeSlate(currentDescription),
            sections: currentSections,
            signature: currentSignature,
            witness: currentWitness,
        }, override);
        if (protocol && protocol.signedOn) {
            newProtocol.signedOn = protocol.signedOn;
        }
        if (protocol && protocol.witnessedOn) {
            newProtocol.witnessedOn = protocol.witnessedOn;
        }
        protocolUpsert(newProtocol);
    }

    return <>
        <SharingModal
            show={showSharingModal}
            setShow={show => setShowSharingModal(show || false)}
            targetName="Protocol"
            targetPath={`/protocol/${id}`}
        />
        <Form className="mt-4">
            <Form.Group>
                <Form.Label><h2 className="row">Protocol Title</h2></Form.Label>
                <InputGroup>
                    <Form.Control
                        type="text"
                        value={currentName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
                        disabled={isSigned || isWitnessed}
                    />
                    <InputGroup.Append>
                        <Button variant="secondary" onClick={() => setShowSharingModal(true)}>
                            <Share /> Share
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form.Group>
            <Form.Group>
                <Form.Label>Description</Form.Label>
                <Slate
                    editor={editor}
                    value={currentDescription}
                    onChange={setDescription}
                >
                    <Toolbar />
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        placeholder="Enter a description here..."
                        onKeyDown={onHotkeyDown(editor)}
                        spellCheck
                        disabled={isSigned || isWitnessed}
                    />
                </Slate>
            </Form.Group>

            {currentSections.map((section, index) => {
                if (!section || !section.id) {
                    return undefined;
                }
                return <Draggable key={section.id} type="protocol-section" index={index} move={moveSection}>
                    <ProtocolSectionEditor disabled={isSigned || isWitnessed} index={index} section={section} setSection={updateSection} deleteSection={() => deleteSection(section && section.id)} />
                </Draggable>
            })}

            {
                !isSigned && !isWitnessed && <div className="row">
                    <Button className="col-auto my-3 mx-auto" onClick={() => addSection({ id: uuid.v4() })}>Add a new section</Button>
                </div>
            }

            <div className="row">
                <Form.Group className="col-3 ml-auto">
                    <Form.Label>Protocol Signature</Form.Label>
                    <InputGroup>
                        <Form.Control
                            className="flow-signature"
                            type="text"
                            value={currentSignature}
                            disabled={true}
                        />
                        <InputGroup.Append>
                            <Button variant="secondary" onClick={() => {
                                const override: Protocol = {};
                                if (isSigned) {
                                    override.signature = "";
                                    override.witness = "";
                                } else {
                                    if (loggedInUser) {
                                        override.signature = loggedInUser.fullName;
                                        override.signedOn = moment().format();
                                    }
                                }
                                syncProtocol(override);
                            }}>
                                {(isSigned || isWitnessed) ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

            {
                protocol && protocol.signedOn && <div className="row">
                    <div className="col-3 ml-auto">
                        Signed On: {moment(protocol && protocol.signedOn).format('LLLL')}
                    </div>
                </div>
            }

            <div className="row">
                <Form.Group className="col-3 ml-auto">
                    <Form.Label>Protocol Witness</Form.Label>
                    <InputGroup>
                        <Form.Control
                            className="flow-signature"
                            type="text"
                            value={currentWitness}
                            disabled={true}
                        />
                        <InputGroup.Append>
                            <Button variant="secondary" disabled={!isSigned} onClick={() => {
                                const override: Protocol = {};
                                if (isWitnessed) {
                                    override.witness = "";
                                } else {
                                    if (loggedInUser) {
                                        override.witness = loggedInUser.fullName;
                                        override.witnessedOn = moment().format();
                                    }
                                }
                                syncProtocol(override);
                            }}>
                                {isWitnessed ? 'Un-sign' : 'Sign'}
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </div>

            {
                protocol && protocol.witnessedOn && <div className="row">
                    <div className="col-3 ml-auto">
                        Witnessed On: {moment(protocol && protocol.witnessedOn).format('LLLL')}
                    </div>
                </div>
            }

            <div className="row">
                <Button
                    className="col-auto"
                    variant="success"
                    onClick={async () => {
                        if (!protocol) {
                            return;
                        }
                        // Create new run
                        const created = await runUpsert({
                            status: 'todo',
                            sections: protocol.sections && protocol.sections.map(section => ({
                                definition: section,
                                blocks: section.blocks && section.blocks.map(definition => ({
                                    type: definition.type,
                                    definition,
                                } as Block)),
                            } as Section)),
                            protocol,
                        });
                        // Redirect to the new run page editor
                        history.push(`/run/${created.id}`);
                    }}
                >
                    Create Run
                </Button>
                <Button
                    className="col-auto ml-3"
                    variant="primary"
                    onClick={() => syncProtocol()}
                    disabled={formSaving}
                >
                    {
                        formSaving
                            ? <><Spinner size="sm" animation="border" /> Saving...</>
                            : <>Save</>
                    }
                </Button>
                <div className="col"></div>
                <div className="col-auto my-auto">
                    {formSavedTime && <><CheckCircle /> Last saved on: {moment(formSavedTime).format('LLLL')}</>}
                </div>
            </div>
        </Form>
    </>;
}
