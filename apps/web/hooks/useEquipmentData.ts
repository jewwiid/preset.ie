import { useApiQuery } from './useApiQuery';
import type { EquipmentType, EquipmentBrand, PredefinedModel, Purpose } from '../types/marketplace';

interface EquipmentDataResponse {
  equipmentTypes: EquipmentType[];
  equipmentBrands: EquipmentBrand[];
  predefinedModels: PredefinedModel[];
}

interface PurposesResponse {
  purposes: Purpose[];
}

export function useEquipmentData(isOpen: boolean) {
  // Fetch equipment data (types, brands, models)
  const {
    data: equipmentData,
    loading: equipmentLoading,
    error: equipmentError,
  } = useApiQuery<EquipmentDataResponse>({
    endpoint: '/api/marketplace/equipment?type=all',
    enabled: isOpen,
    dependencies: [isOpen],
    onError: (err) => console.error('Error fetching equipment data:', err),
  });

  // Fetch purposes
  const {
    data: purposesData,
    loading: purposesLoading,
  } = useApiQuery<PurposesResponse>({
    endpoint: '/api/marketplace/purposes?limit=200',
    enabled: isOpen,
    dependencies: [isOpen],
    onError: (err) => console.error('Error fetching purposes data:', err),
  });

  return {
    equipmentTypes: equipmentData?.equipmentTypes || [],
    equipmentBrands: equipmentData?.equipmentBrands || [],
    predefinedModels: equipmentData?.predefinedModels || [],
    purposes: purposesData?.purposes || [],
    loading: equipmentLoading || purposesLoading,
    error: equipmentError,
  };
}
