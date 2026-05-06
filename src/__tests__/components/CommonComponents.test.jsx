// CommonComponents.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal, LoadingSpinner, EmptyState, ConfirmDialog, PageHeader, Badge, FormField } from '../../components/common/index';

describe('Modal', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(<Modal isOpen={false} onClose={jest.fn()} title="Test" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and children when isOpen=true', () => {
    render(
        <Modal isOpen onClose={jest.fn()} title="My Modal">
          <p>Modal body</p>
        </Modal>
    );
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
        <Modal isOpen onClose={onClose} title="T">
          <p>body</p>
        </Modal>
    );
    fireEvent.click(container.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = jest.fn();
    render(<Modal isOpen onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
        <Modal isOpen onClose={jest.fn()} title="T" footer={<button>Save</button>}>
          <p>body</p>
        </Modal>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not propagate clicks from modal content to overlay', () => {
    const onClose = jest.fn();
    const { container } = render(
        <Modal isOpen onClose={onClose} title="T"><p>body</p></Modal>
    );
    fireEvent.click(container.querySelector('.modal-content'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('LoadingSpinner', () => {
  it('renders spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders spinner-lg class for size=lg', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.querySelector('.spinner-lg')).toBeInTheDocument();
  });

  it('renders text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not render text when not provided', () => {
    const { queryByRole } = render(<LoadingSpinner />);
    expect(queryByRole('paragraph')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders action element when provided', () => {
    render(<EmptyState title="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(
        <ConfirmDialog isOpen={false} onClose={jest.fn()} onConfirm={jest.fn()} title="T" message="M" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and message when isOpen=true', () => {
    render(
        <ConfirmDialog isOpen onClose={jest.fn()} onConfirm={jest.fn()} title="Delete?" message="Are you sure?" />
    );
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(
        <ConfirmDialog isOpen onClose={jest.fn()} onConfirm={onConfirm} title="T" message="M" confirmText="Delete" />
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(
        <ConfirmDialog isOpen onClose={onClose} onConfirm={jest.fn()} title="T" message="M" />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Flights" />);
    expect(screen.getByText('Flights')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Flights" subtitle="All flights" />);
    expect(screen.getByText('All flights')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(<PageHeader title="Flights" actions={<button>Add</button>} />);
    expect(screen.getByText('Add')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge status="CONFIRMED" label="Confirmed" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('falls back to status as label when no label provided', () => {
    render(<Badge status="PENDING" />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('applies correct class for CONFIRMED status', () => {
    const { container } = render(<Badge status="CONFIRMED" />);
    expect(container.querySelector('.badge-success')).toBeInTheDocument();
  });

  it('applies badge-gray for unknown status', () => {
    const { container } = render(<Badge status="UNKNOWN_STATUS" />);
    expect(container.querySelector('.badge-gray')).toBeInTheDocument();
  });

  it('applies badge-error for CANCELLED status', () => {
    const { container } = render(<Badge status="CANCELLED" />);
    expect(container.querySelector('.badge-error')).toBeInTheDocument();
  });
});

describe('FormField', () => {
  it('renders label when provided', () => {
    render(<FormField label="Email"><input /></FormField>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<FormField error="Required"><input /></FormField>);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<FormField><input data-testid="inp" /></FormField>);
    expect(screen.getByTestId('inp')).toBeInTheDocument();
  });
});