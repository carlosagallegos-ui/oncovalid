// Base de datos de protocolos de quimioterapia comunes en México
// Dosis basadas en guías NCCN, GPC mexicanas y consensos internacionales

export const CHEMO_PROTOCOLS = {
  // Cáncer de mama
  "AC": {
    name: "AC (Doxorrubicina/Ciclofosfamida)",
    indication: "Cáncer de mama",
    cycle_days: 21,
    total_cycles: 4,
    drugs: [
      { drug_name: "Doxorrubicina", dose_per_unit: 60, dose_basis: "mg/m²", route: "IV", infusion_time: "15-30 min", diluent: "SSN 0.9%", volume_ml: 100, max_lifetime_dose: 450, vial_size: 50, vial_unit: "mg" },
      { drug_name: "Ciclofosfamida", dose_per_unit: 600, dose_basis: "mg/m²", route: "IV", infusion_time: "30-60 min", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 1000, vial_unit: "mg" }
    ]
  },
  "AC-T": {
    name: "AC-T (AC seguido de Paclitaxel)",
    indication: "Cáncer de mama",
    cycle_days: 21,
    total_cycles: 8,
    drugs: [
      { drug_name: "Doxorrubicina", dose_per_unit: 60, dose_basis: "mg/m²", route: "IV", infusion_time: "15-30 min", diluent: "SSN 0.9%", volume_ml: 100, max_lifetime_dose: 450, vial_size: 50, vial_unit: "mg" },
      { drug_name: "Ciclofosfamida", dose_per_unit: 600, dose_basis: "mg/m²", route: "IV", infusion_time: "30-60 min", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 1000, vial_unit: "mg" },
      { drug_name: "Paclitaxel", dose_per_unit: 175, dose_basis: "mg/m²", route: "IV", infusion_time: "3 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 300, vial_unit: "mg" }
    ]
  },
  "TC": {
    name: "TC (Docetaxel/Ciclofosfamida)",
    indication: "Cáncer de mama",
    cycle_days: 21,
    total_cycles: 4,
    drugs: [
      { drug_name: "Docetaxel", dose_per_unit: 75, dose_basis: "mg/m²", route: "IV", infusion_time: "1 hr", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 80, vial_unit: "mg" },
      { drug_name: "Ciclofosfamida", dose_per_unit: 600, dose_basis: "mg/m²", route: "IV", infusion_time: "30-60 min", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 1000, vial_unit: "mg" }
    ]
  },
  "TCH": {
    name: "TCH (Docetaxel/Carboplatino/Trastuzumab)",
    indication: "Cáncer de mama HER2+",
    cycle_days: 21,
    total_cycles: 6,
    drugs: [
      { drug_name: "Docetaxel", dose_per_unit: 75, dose_basis: "mg/m²", route: "IV", infusion_time: "1 hr", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 80, vial_unit: "mg" },
      { drug_name: "Carboplatino", dose_per_unit: 6, dose_basis: "AUC", route: "IV", infusion_time: "30-60 min", diluent: "SG 5%", volume_ml: 250, vial_size: 450, vial_unit: "mg" },
      { drug_name: "Trastuzumab", dose_per_unit: 8, dose_basis: "mg/kg", route: "IV", infusion_time: "90 min", diluent: "SSN 0.9%", volume_ml: 250, note: "Dosis de carga 8 mg/kg, mantenimiento 6 mg/kg", vial_size: 440, vial_unit: "mg" }
    ]
  },

  // Cáncer colorrectal
  "FOLFOX": {
    name: "FOLFOX (5-FU/Leucovorina/Oxaliplatino)",
    indication: "Cáncer colorrectal",
    cycle_days: 14,
    total_cycles: 12,
    drugs: [
      { drug_name: "Oxaliplatino", dose_per_unit: 85, dose_basis: "mg/m²", route: "IV", infusion_time: "2 hrs", diluent: "SG 5%", volume_ml: 500, vial_size: 100, vial_unit: "mg" },
      { drug_name: "Leucovorina", dose_per_unit: 400, dose_basis: "mg/m²", route: "IV", infusion_time: "2 hrs", diluent: "SG 5%", volume_ml: 250, vial_size: 200, vial_unit: "mg" },
      { drug_name: "5-Fluorouracilo bolo", dose_per_unit: 400, dose_basis: "mg/m²", route: "IV", infusion_time: "Bolo", diluent: "Directo", volume_ml: 0, vial_size: 500, vial_unit: "mg" },
      { drug_name: "5-Fluorouracilo infusión", dose_per_unit: 2400, dose_basis: "mg/m²", route: "IV", infusion_time: "46 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 500, vial_unit: "mg" }
    ]
  },
  "FOLFIRI": {
    name: "FOLFIRI (5-FU/Leucovorina/Irinotecán)",
    indication: "Cáncer colorrectal",
    cycle_days: 14,
    total_cycles: 12,
    drugs: [
      { drug_name: "Irinotecán", dose_per_unit: 180, dose_basis: "mg/m²", route: "IV", infusion_time: "90 min", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 100, vial_unit: "mg" },
      { drug_name: "Leucovorina", dose_per_unit: 400, dose_basis: "mg/m²", route: "IV", infusion_time: "2 hrs", diluent: "SG 5%", volume_ml: 250, vial_size: 200, vial_unit: "mg" },
      { drug_name: "5-Fluorouracilo bolo", dose_per_unit: 400, dose_basis: "mg/m²", route: "IV", infusion_time: "Bolo", diluent: "Directo", volume_ml: 0, vial_size: 500, vial_unit: "mg" },
      { drug_name: "5-Fluorouracilo infusión", dose_per_unit: 2400, dose_basis: "mg/m²", route: "IV", infusion_time: "46 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 500, vial_unit: "mg" }
    ]
  },
  "XELOX": {
    name: "XELOX (Capecitabina/Oxaliplatino)",
    indication: "Cáncer colorrectal",
    cycle_days: 21,
    total_cycles: 8,
    drugs: [
      { drug_name: "Oxaliplatino", dose_per_unit: 130, dose_basis: "mg/m²", route: "IV", infusion_time: "2 hrs", diluent: "SG 5%", volume_ml: 500, vial_size: 100, vial_unit: "mg" },
      { drug_name: "Capecitabina", dose_per_unit: 1000, dose_basis: "mg/m²", route: "VO", infusion_time: "c/12h D1-14", diluent: "N/A", volume_ml: 0, vial_size: 500, vial_unit: "mg" }
    ]
  },

  // Linfomas
  "R-CHOP": {
    name: "R-CHOP",
    indication: "Linfoma No Hodgkin",
    cycle_days: 21,
    total_cycles: 6,
    drugs: [
      { drug_name: "Rituximab", dose_per_unit: 375, dose_basis: "mg/m²", route: "IV", infusion_time: "4-6 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 500, vial_unit: "mg" },
      { drug_name: "Ciclofosfamida", dose_per_unit: 750, dose_basis: "mg/m²", route: "IV", infusion_time: "30-60 min", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 1000, vial_unit: "mg" },
      { drug_name: "Doxorrubicina", dose_per_unit: 50, dose_basis: "mg/m²", route: "IV", infusion_time: "15-30 min", diluent: "SSN 0.9%", volume_ml: 100, max_lifetime_dose: 450, vial_size: 50, vial_unit: "mg" },
      { drug_name: "Vincristina", dose_per_unit: 1.4, dose_basis: "mg/m²", route: "IV", infusion_time: "Bolo", diluent: "SSN 0.9%", volume_ml: 50, max_single_dose: 2, vial_size: 1, vial_unit: "mg" },
      { drug_name: "Prednisona", dose_per_unit: 100, dose_basis: "mg", route: "VO", infusion_time: "D1-5", diluent: "N/A", volume_ml: 0, vial_size: 50, vial_unit: "mg" }
    ]
  },
  "ABVD": {
    name: "ABVD",
    indication: "Linfoma de Hodgkin",
    cycle_days: 28,
    total_cycles: 6,
    drugs: [
      { drug_name: "Doxorrubicina", dose_per_unit: 25, dose_basis: "mg/m²", route: "IV", infusion_time: "15-30 min", diluent: "SSN 0.9%", volume_ml: 100, max_lifetime_dose: 450, vial_size: 50, vial_unit: "mg" },
      { drug_name: "Bleomicina", dose_per_unit: 10, dose_basis: "U/m²", route: "IV", infusion_time: "15 min", diluent: "SSN 0.9%", volume_ml: 100, vial_size: 15, vial_unit: "U" },
      { drug_name: "Vinblastina", dose_per_unit: 6, dose_basis: "mg/m²", route: "IV", infusion_time: "Bolo", diluent: "SSN 0.9%", volume_ml: 50, vial_size: 10, vial_unit: "mg" },
      { drug_name: "Dacarbazina", dose_per_unit: 375, dose_basis: "mg/m²", route: "IV", infusion_time: "30-60 min", diluent: "SG 5%", volume_ml: 250, vial_size: 200, vial_unit: "mg" }
    ]
  },

  // Cáncer de pulmón
  "Carboplatino-Paclitaxel": {
    name: "Carboplatino/Paclitaxel",
    indication: "Cáncer de pulmón NSCLC",
    cycle_days: 21,
    total_cycles: 4,
    drugs: [
      { drug_name: "Paclitaxel", dose_per_unit: 200, dose_basis: "mg/m²", route: "IV", infusion_time: "3 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 300, vial_unit: "mg" },
      { drug_name: "Carboplatino", dose_per_unit: 6, dose_basis: "AUC", route: "IV", infusion_time: "30-60 min", diluent: "SG 5%", volume_ml: 250, vial_size: 450, vial_unit: "mg" }
    ]
  },
  "Cisplatino-Pemetrexed": {
    name: "Cisplatino/Pemetrexed",
    indication: "Cáncer de pulmón NSCLC (no escamoso)",
    cycle_days: 21,
    total_cycles: 4,
    drugs: [
      { drug_name: "Pemetrexed", dose_per_unit: 500, dose_basis: "mg/m²", route: "IV", infusion_time: "10 min", diluent: "SSN 0.9%", volume_ml: 100, vial_size: 500, vial_unit: "mg" },
      { drug_name: "Cisplatino", dose_per_unit: 75, dose_basis: "mg/m²", route: "IV", infusion_time: "1-2 hrs", diluent: "SSN 0.9%", volume_ml: 500, note: "Requiere hidratación pre y post", vial_size: 50, vial_unit: "mg" }
    ]
  },

  // Cáncer gástrico
  "FLOT": {
    name: "FLOT (5-FU/Leucovorina/Oxaliplatino/Docetaxel)",
    indication: "Cáncer gástrico / unión gastroesofágica",
    cycle_days: 14,
    total_cycles: 8,
    drugs: [
      { drug_name: "Docetaxel", dose_per_unit: 50, dose_basis: "mg/m²", route: "IV", infusion_time: "1 hr", diluent: "SSN 0.9%", volume_ml: 250, vial_size: 80, vial_unit: "mg" },
      { drug_name: "Oxaliplatino", dose_per_unit: 85, dose_basis: "mg/m²", route: "IV", infusion_time: "2 hrs", diluent: "SG 5%", volume_ml: 500, vial_size: 100, vial_unit: "mg" },
      { drug_name: "Leucovorina", dose_per_unit: 200, dose_basis: "mg/m²", route: "IV", infusion_time: "2 hrs", diluent: "SG 5%", volume_ml: 250, vial_size: 200, vial_unit: "mg" },
      { drug_name: "5-Fluorouracilo infusión", dose_per_unit: 2600, dose_basis: "mg/m²", route: "IV", infusion_time: "24 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 500, vial_unit: "mg" }
    ]
  },

  // Cáncer de ovario
  "Carboplatino-Paclitaxel-Ovario": {
    name: "Carboplatino/Paclitaxel (Ovario)",
    indication: "Cáncer de ovario",
    cycle_days: 21,
    total_cycles: 6,
    drugs: [
      { drug_name: "Paclitaxel", dose_per_unit: 175, dose_basis: "mg/m²", route: "IV", infusion_time: "3 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 300, vial_unit: "mg" },
      { drug_name: "Carboplatino", dose_per_unit: 5, dose_basis: "AUC", route: "IV", infusion_time: "30-60 min", diluent: "SG 5%", volume_ml: 250, vial_size: 450, vial_unit: "mg" }
    ]
  },

  // Cáncer cervicouterino
  "Cisplatino-Paclitaxel-CaCu": {
    name: "Cisplatino/Paclitaxel (CaCu)",
    indication: "Cáncer cervicouterino",
    cycle_days: 21,
    total_cycles: 6,
    drugs: [
      { drug_name: "Cisplatino", dose_per_unit: 50, dose_basis: "mg/m²", route: "IV", infusion_time: "1-2 hrs", diluent: "SSN 0.9%", volume_ml: 500, note: "Requiere hidratación", vial_size: 50, vial_unit: "mg" },
      { drug_name: "Paclitaxel", dose_per_unit: 175, dose_basis: "mg/m²", route: "IV", infusion_time: "3 hrs", diluent: "SSN 0.9%", volume_ml: 500, vial_size: 300, vial_unit: "mg" }
    ]
  },

  // Cáncer testicular
  "BEP": {
    name: "BEP (Bleomicina/Etóposido/Cisplatino)",
    indication: "Cáncer testicular",
    cycle_days: 21,
    total_cycles: 3,
    drugs: [
      { drug_name: "Cisplatino", dose_per_unit: 20, dose_basis: "mg/m²", route: "IV", infusion_time: "1-2 hrs", diluent: "SSN 0.9%", volume_ml: 500, note: "D1-5, requiere hidratación", vial_size: 50, vial_unit: "mg" },
      { drug_name: "Etóposido", dose_per_unit: 100, dose_basis: "mg/m²", route: "IV", infusion_time: "1 hr", diluent: "SSN 0.9%", volume_ml: 500, note: "D1-5", vial_size: 100, vial_unit: "mg" },
      { drug_name: "Bleomicina", dose_per_unit: 30, dose_basis: "U", route: "IV", infusion_time: "15 min", diluent: "SSN 0.9%", volume_ml: 100, note: "D1,8,15", vial_size: 15, vial_unit: "U" }
    ]
  }
};

// Calcula BSA usando fórmula de Mosteller
export function calculateBSA(weightKg, heightCm) {
  if (!weightKg || !heightCm) return 0;
  return Math.sqrt((weightKg * heightCm) / 3600);
}

// Calcula dosis por AUC (Calvert) para Carboplatino
export function calculateCarboplatin(auc, creatinineClearance) {
  if (!auc || !creatinineClearance) return 0;
  return auc * (creatinineClearance + 25);
}

// Calcula la dosis basada en el tipo de dosificación
export function calculateDose(drug, bsa, weightKg, creatinineClearance) {
  const { dose_per_unit, dose_basis, max_single_dose } = drug;
  let calculatedDose = 0;

  switch (dose_basis) {
    case "mg/m²":
    case "U/m²":
      calculatedDose = dose_per_unit * bsa;
      break;
    case "mg/kg":
      calculatedDose = dose_per_unit * weightKg;
      break;
    case "AUC":
      calculatedDose = calculateCarboplatin(dose_per_unit, creatinineClearance || 100);
      break;
    case "mg":
    case "U":
      calculatedDose = dose_per_unit;
      break;
    default:
      calculatedDose = dose_per_unit * bsa;
  }

  // Aplicar dosis máxima si existe
  if (max_single_dose && calculatedDose > max_single_dose) {
    calculatedDose = max_single_dose;
  }

  return Math.round(calculatedDose * 100) / 100;
}

// Valida la dosis prescrita vs calculada (tolerancia ±10%)
export function validateDose(prescribedDose, calculatedDose, tolerance = 0.10) {
  if (!prescribedDose || !calculatedDose) return { isValid: false, variance: 0, message: "Datos insuficientes" };
  
  const variance = (prescribedDose - calculatedDose) / calculatedDose;
  const isValid = Math.abs(variance) <= tolerance;
  
  let message = "";
  if (isValid) {
    message = "Dosis dentro del rango aceptable";
  } else if (variance > 0) {
    message = `Dosis SUPERIOR al calculado por ${(variance * 100).toFixed(1)}%`;
  } else {
    message = `Dosis INFERIOR al calculado por ${(Math.abs(variance) * 100).toFixed(1)}%`;
  }

  return {
    isValid,
    variance: Math.round(variance * 10000) / 100,
    message
  };
}

// Genera alertas para la prescripción
export function generateAlerts(drugs, patient) {
  const alerts = [];

  drugs.forEach(drug => {
    // Alerta de función renal para cisplatino
    if (drug.drug_name.toLowerCase().includes("cisplatino") && patient.creatinine_clearance && patient.creatinine_clearance < 60) {
      alerts.push(`⚠️ Precaución: Depuración de creatinina (${patient.creatinine_clearance} mL/min) baja para Cisplatino. Considerar Carboplatino.`);
    }

    // Alerta de función hepática para taxanos
    if ((drug.drug_name.toLowerCase().includes("docetaxel") || drug.drug_name.toLowerCase().includes("paclitaxel")) 
        && patient.hepatic_function && patient.hepatic_function !== "Normal") {
      alerts.push(`⚠️ Función hepática ${patient.hepatic_function}: Considerar ajuste de dosis para ${drug.drug_name}.`);
    }

    // Alerta BSA > 2.0
    if (patient.bsa > 2.2) {
      alerts.push(`⚠️ SCT elevada (${patient.bsa.toFixed(2)} m²). Verificar si se requiere tope de dosis.`);
    }
  });

  return [...new Set(alerts)];
}

export function getProtocolsByIndication() {
  const grouped = {};
  Object.entries(CHEMO_PROTOCOLS).forEach(([key, protocol]) => {
    if (!grouped[protocol.indication]) {
      grouped[protocol.indication] = [];
    }
    grouped[protocol.indication].push({ key, ...protocol });
  });
  return grouped;
}