export const cimStoryChapters = [
  {
    id: 'system-view',
    index: '01',
    kicker: 'SYSTEM VIEW',
    title: 'Start with the whole machine.',
    copy: 'A motorcycle gives the story a concrete system to inspect. CIM uses the same engineering mindset: observe a complete machine before deciding where to measure, control, or maintain it.',
    focus: 'SYSTEM // OVERVIEW',
    // These values deliberately mirror the six authored ScrollMarkers in the
    // supplied 3D scene. Their DOM order is its public interface.
    timelineMarker: '0'
  },
  {
    id: 'observe',
    index: '02',
    kicker: 'INSTRUMENTATION',
    title: 'Read the machine.',
    copy: 'The front assembly becomes a sensor station: speed, vibration, position, and temperature turn motion into information CIM students can inspect.',
    focus: 'FRONT // SENSE',
    timelineMarker: '15.2'
  },
  {
    id: 'coordinate',
    index: '03',
    kicker: 'AUTOMATION',
    title: 'Connect signal to action.',
    copy: 'As the camera moves into the core, measurement meets logic. Controllers, interfaces, and industrial software coordinate what the system should do next.',
    focus: 'CORE // CONTROL',
    timelineMarker: '15.4'
  },
  {
    id: 'disassemble',
    index: '04',
    kicker: 'MAINTENANCE',
    title: 'Open the assembly.',
    copy: 'The scene breaks the motorcycle into inspectable relationships. This is the maintenance question: which part, signal, or interface can explain the condition we are seeing?',
    focus: 'ASSEMBLY // OPEN',
    timelineMarker: '18.2'
  },
  {
    id: 'inspect',
    index: '05',
    kicker: 'SYSTEMS THINKING',
    title: 'Trace every dependency.',
    copy: 'With the machine opened, frame, drive, braking, power, and feedback can be read as one connected system rather than isolated parts.',
    focus: 'SYSTEM // EXPOSED',
    timelineMarker: '24.5'
  },
  {
    id: 'reassemble',
    index: '06',
    kicker: 'CIM IN PRACTICE',
    title: 'Reassemble the knowledge.',
    copy: 'The bike resolves back into one machine. CIM follows the same path—from workshop insight and industrial tools to systems students can understand, improve, and maintain together.',
    focus: 'CIM // READY',
    timelineMarker: '29'
  }
] as const

export type CimStoryChapterId = (typeof cimStoryChapters)[number]['id']
