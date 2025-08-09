import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

// Hook for managing complex form state with validation
export const useFormState = <T extends Record<string, any>>(
  initialState: T,
  validators: Partial<Record<keyof T, (value: any) => string | null>> = {}
) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field if validator exists
    if (validators[field]) {
      const error = validators[field]!(value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [validators]);

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validators).forEach((key) => {
      const field = key as keyof T;
      const validator = validators[field];
      if (validator) {
        const error = validator(formData[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validators]);

  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  const hasErrors = useMemo(() => 
    Object.values(errors).some(error => error !== null)
  , [errors]);

  const isFieldTouched = useCallback((field: keyof T) => 
    touched[field] || false
  , [touched]);

  return {
    formData,
    errors,
    touched,
    updateField,
    validateAll,
    reset,
    hasErrors,
    isFieldTouched,
    setFormData,
    setErrors
  };
};

// Hook for managing paginated data with filtering and sorting
export const usePaginatedData = <T,>(
  data: T[],
  itemsPerPage: number = 10,
  defaultFilters: Record<string, any> = {},
  defaultSort: { field: keyof T; direction: 'asc' | 'desc' } | null = null
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [searchTerm, setSearchTerm] = useState('');

  // Apply filters and search
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Apply search term
      if (searchTerm) {
        const searchString = Object.values(item as any).join(' ').toLowerCase();
        if (!searchString.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Apply filters
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === '') return true;
        const itemValue = (item as any)[key];
        
        if (typeof value === 'string') {
          return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue === value;
      });
    });
  }, [data, filters, searchTerm]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.field];
      const bValue = (b as any)[sortConfig.field];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const updateSort = useCallback((field: keyof T, direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  const toggleSort = useCallback((field: keyof T) => {
    setSortConfig(prev => {
      if (!prev || prev.field !== field) {
        return { field, direction: 'asc' };
      }
      return {
        field,
        direction: prev.direction === 'asc' ? 'desc' : 'asc'
      };
    });
    setCurrentPage(1);
  }, []);

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems: sortedData.length,
    filteredCount: filteredData.length,
    setCurrentPage,
    filters,
    updateFilter,
    setFilters,
    sortConfig,
    updateSort,
    toggleSort,
    searchTerm,
    setSearchTerm,
    hasFilters: Object.values(filters).some(v => v && v !== ''),
    clearFilters: () => {
      setFilters(defaultFilters);
      setSearchTerm('');
      setCurrentPage(1);
    }
  };
};

// Hook for managing modal/dialog state with animations
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsAnimating(true);
  }, []);

  const close = useCallback(() => {
    setIsAnimating(false);
    // Delay closing to allow exit animation
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  return {
    isOpen,
    isAnimating,
    open,
    close,
    toggle,
    setIsOpen
  };
};

// Hook for managing async operations with loading and error states
export const useAsyncOperation = <T = any, P = any>(
  operation: (params: P) => Promise<T>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { toast } = useToast();

  const execute = useCallback(async (params: P, options: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation(params);
      setData(result);

      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        });
      }

      options.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || options.errorMessage || 'An error occurred';
      setError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      options.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operation, toast]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    isSuccess: data !== null && !error,
    isError: error !== null
  };
};

// Hook for managing component state with local storage persistence
export const usePersistedState = <T,>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // Handle localStorage errors silently
      }
      return newValue;
    });
  }, [key]);

  return [state, setPersistedState];
};