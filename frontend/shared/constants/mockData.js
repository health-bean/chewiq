// Mock data for missing APIs
export const MOCK_USER_PREFERENCES = {
  protocols: ['1495844a-19de-404c-a288-7660eda0cbe1', 'eb9d6546-39bf-46ec-a594-f6e98d24b7ff'], // AIP + AIP Reintro
  quick_supplements: [
    { id: 'vit_d_1', name: 'Vitamin D 5000 IU', category: 'vitamin' },
    { id: 'omega_1', name: 'Omega-3 Fish Oil', category: 'essential_fatty_acid' },
    { id: 'prob_1', name: 'Probiotic Blend', category: 'probiotic' }
  ],
  quick_medications: [
    { id: 'thyroid_1', name: 'Thyroid Medication', category: 'hormone' }
  ],
  quick_foods: [
    { id: 'chicken_1', name: 'Chicken breast', category: 'protein' },
    { id: 'broccoli_1', name: 'Broccoli', category: 'vegetable' },
    { id: 'avocado_1', name: 'Avocado', category: 'fat' }
  ],
  quick_symptoms: [
    { id: 'joint_1', name: 'Joint Pain', category: 'pain' },
    { id: 'fog_1', name: 'Brain Fog', category: 'cognitive' },
    { id: 'fatigue_1', name: 'Fatigue', category: 'energy' }
  ],
  quick_detox: [
    { id: 'sauna_1', name: 'Sauna', category: 'heat' },
    { id: 'coffee_enema_1', name: 'Coffee Enema', category: 'internal' },
    { id: 'epsom_bath_1', name: 'Epsom Bath', category: 'bath' }
  ],
  setup_complete: false
};

export const MOCK_EXPOSURE_TYPES = [
  { id: 'mold_1', name: 'Mold Exposure', category: 'Environmental' },
  { id: 'clean_1', name: 'Cleaning Products', category: 'Chemical' },
  { id: 'frag_1', name: 'Fragrances/Perfumes', category: 'Chemical' },
  { id: 'emf_1', name: 'WiFi/Electronics', category: 'Electromagnetic' },
  { id: 'stress_1', name: 'Work Stress', category: 'Psychological' },
  { id: 'air_1', name: 'Air Pollution', category: 'Environmental' }
];

export const MOCK_DETOX_TYPES = [
  { id: 'sauna_1', name: 'Sauna', category: 'Heat' },
  { id: 'infrared_1', name: 'Infrared Sauna', category: 'Heat' },
  { id: 'coffee_enema_1', name: 'Coffee Enema', category: 'Internal' },
  { id: 'epsom_bath_1', name: 'Epsom Bath', category: 'Bath' },
  { id: 'detox_bath_1', name: 'Detox Bath', category: 'Bath' },
  { id: 'dry_brushing_1', name: 'Dry Brushing', category: 'Manual' },
  { id: 'lymphatic_1', name: 'Lymphatic Massage', category: 'Manual' },
  { id: 'cold_plunge_1', name: 'Cold Plunge', category: 'Cold' }
];