export type Panel = 'orders' | 'products' | 'interviewer' | 'resume' | 'contact' | 'commands';
export interface OpenProps { onOpen: (panel: Panel) => void }
