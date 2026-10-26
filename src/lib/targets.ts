import type { Targets, Profile } from '../types'

/** ADA Standards of Care defaults, with Asian BMI/waist cut-offs. */
export const DEFAULT_TARGETS: Targets = {
  fastingMin: 80,
  fastingMax: 130,
  postMealMax: 180,
  hypoBelow: 70,
  hba1cMax: 7,
  bmiMin: 18.5,
  bmiMax: 23,
  waistMaxMale: 90,
  waistMaxFemale: 80,
  bpSysMax: 130,
  bpDiaMax: 80,
  ldlMax: 100,
  hdlMinMale: 40,
  hdlMinFemale: 50,
  tgMax: 150,
  egfrMin: 60,
  uacrMax: 30,
  tshMin: 0.4,
  tshMax: 4.0,
}

export const DEFAULT_PROFILE: Profile = {
  id: 'me',
  glucoseUnit: 'mgdl',
  theme: 'system',
  targets: DEFAULT_TARGETS,
}
