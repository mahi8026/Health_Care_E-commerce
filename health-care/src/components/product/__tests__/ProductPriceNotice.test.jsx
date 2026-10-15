import { render, screen } from '@testing-library/react';
import ProductPriceNotice from '../ProductPriceNotice';

describe('ProductPriceNotice', () => {
  it('renders the default Bengali message', () => {
    render(<ProductPriceNotice />);
    
    // Check if the component renders
    const notice = screen.getByRole('alert');
    expect(notice).toBeInTheDocument();
    
    // Check if Bengali text is present
    expect(notice).toHaveTextContent('অর্ডার করার পূর্বে');
  });

  it('renders custom message when provided', () => {
    const customMessage = 'Custom notification message';
    render(<ProductPriceNotice message={customMessage} />);
    
    const notice = screen.getByRole('alert');
    expect(notice).toHaveTextContent(customMessage);
  });

  it('applies custom className', () => {
    const customClass = 'my-custom-class';
    render(<ProductPriceNotice className={customClass} />);
    
    const notice = screen.getByRole('alert');
    expect(notice).toHaveClass(customClass);
  });

  it('has proper accessibility attributes', () => {
    render(<ProductPriceNotice />);
    
    const notice = screen.getByRole('alert');
    expect(notice).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with correct styling', () => {
    render(<ProductPriceNotice />);
    
    const notice = screen.getByRole('alert');
    expect(notice).toHaveStyle({
      backgroundColor: '#FFF9E8',
      borderColor: '#F1DFA3',
      color: '#75652B'
    });
  });
});
