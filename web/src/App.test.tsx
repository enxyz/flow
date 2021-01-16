import React, { Suspense } from 'react';
import { render, waitForElement } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

test('renders learn react link', async () => {
  const { getByText, queryByTestId } = render(
    <RecoilRoot>
      <Suspense fallback={<div>test loading...</div>}>
        <MemoryRouter>
          <App data-testid="test-app" />
        </MemoryRouter>
      </Suspense>
    </RecoilRoot>
  );
  await waitForElement(() => queryByTestId('test-app'));
  const linkElement = getByText(/Flow by LabGrid/i);
  expect(linkElement).toBeInTheDocument();
});
