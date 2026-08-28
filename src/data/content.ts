export type ActivityArea = {
  id: string
  index: string
  title: string
  description: string
  notation: string
}

export type ClubEvent = {
  id: string
  title: string
  dateLabel: string | null
  year: number
  type: 'Workshop' | 'Industrial Visit' | 'Training' | 'Competition' | 'Conference' | 'Project' | 'Other'
  description: string
  partners?: string[]
  tags: string[]
  image?: string
  gallery?: string[]
}

export type TimelineEntry = {
  year: string
  title: string
  description: string
  verified: boolean
}

export type TeamMember = {
  name: string
  role: string
  department?: string
  image?: string
  description?: string
}

export const activityAreas: ActivityArea[] = [
  {
    id: 'automation',
    index: '01',
    title: 'Automation',
    notation: 'PLC // HMI // SCADA',
    description: 'Control systems, industrial automation, and human-machine interfaces.'
  },
  {
    id: 'maintenance',
    index: '02',
    title: 'Maintenance',
    notation: 'DIAG // REL // SYS',
    description: 'Diagnostics, reliability, and practical industrial engineering.'
  },
  {
    id: 'instrumentation',
    index: '03',
    title: 'Instrumentation',
    notation: 'SENSE // MEASURE',
    description: 'Sensors, measurement, monitoring, and engineering signals.'
  },
  {
    id: 'robotics',
    index: '04',
    title: 'Robotics',
    notation: 'EMBED // MOTION',
    description: 'Embedded systems, robotics, and intelligent machines.'
  },
  {
    id: 'industrial-it',
    index: '05',
    title: 'Industrial IT',
    notation: 'CODE // DATA // IOT',
    description: 'Programming, connected systems, digitalization, and data.'
  },
  {
    id: 'training',
    index: '06',
    title: 'Training',
    notation: 'TOOLS // PRACTICE',
    description: 'Engineering tools, professional software, and hands-on workshops.'
  }
]

export const timeline: TimelineEntry[] = [
  {
    year: '2013',
    title: 'Foundation',
    description: 'Club INSAT Maintenance is founded by INSAT students.',
    verified: true
  },
  {
    year: 'Today',
    title: 'Practical engineering',
    description: 'A student bridge between engineering learning and the industrial world.',
    verified: true
  }
]

export const events: ClubEvent[] = [
  {
    id: 'solidworks-day-2025',
    title: 'SolidWorks Day',
    dateLabel: '26 January 2025',
    year: 2025,
    type: 'Workshop',
    description: 'A day of SolidWorks workshops, CSWA / CSWP certification opportunities, practical CAD learning, and engineering networking.',
    partners: ['ABBK PHYSICSWORKS'],
    tags: ['CAD', 'SolidWorks', 'Certification']
  },
  {
    id: 'plc-industrial-automation-2025',
    title: 'Introduction to PLCs & Industrial Automation',
    dateLabel: 'February–May 2025',
    year: 2025,
    type: 'Training',
    description: 'A three-part workshop series covering automation fundamentals, PLCs, HMIs, SCADA, DCS, PLC architecture, IEC 61131-3, and programming concepts.',
    tags: ['PLC', 'Automation', 'HMI', 'SCADA']
  },
  {
    id: 'simulation-day-2025',
    title: 'Simulation Day',
    dateLabel: null,
    year: 2025,
    type: 'Other',
    description: 'A CIM-coordinated introduction to numerical simulation in biomechanics.',
    tags: ['Simulation', 'Biomechanics']
  },
  {
    id: 'coficab-industrial-visit-2025',
    title: 'Industrial Visit — Coficab',
    dateLabel: '28 November 2025',
    year: 2025,
    type: 'Industrial Visit',
    description: 'Tour of Coficab production lines and insights into automotive cable manufacturing and electrification.',
    partners: ['Coficab'],
    tags: ['Industrial Visit', 'Coficab', 'Manufacturing']
  }
]

// Add real bureau profiles here. Empty by design: no members have been supplied.
export const team: TeamMember[] = []

export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Activities', href: '/#activities' },
  { label: 'Team', href: '/#team' }
]

export const studyFields = ['MPI', 'CBA', 'IMI', 'IIA', 'RT', 'GL', 'CH', 'BIO', 'MIQ'] as const
export type StudyField = (typeof studyFields)[number]
export const studyLevels = ['1', '2', '3', '4', '5'] as const
export type StudyLevel = (typeof studyLevels)[number]

export type RegistrationPayload = {
  fullName: string
  fieldOfStudy: StudyField | ''
  levelOfStudy: StudyLevel | ''
  facebookProfile: string
  email: string
  phone: string
  comments: string
  website: string
}
