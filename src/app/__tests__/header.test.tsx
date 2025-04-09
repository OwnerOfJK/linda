import { render } from '@testing-library/react-native';
import React from 'react';

import Header from 'components/header';

describe('<Header />', () => {
  test('Text renders correctly on Header', () => {
    const { getByText } = render(<Header />);
    getByText('Header');
  });
});
