import { ArrowRight, Compass, Store, Target } from 'lucide-react'

export function ContextRibbon({business,focus,action}:{business:string;focus:string;action:string}){
  return <div className="nx-context-ribbon" aria-label="How your answers connect to the next action"><div><span><Store size={17}/></span><small>YOUR BUSINESS</small><strong>{business}</strong></div><ArrowRight size={16} aria-hidden="true"/><div><span><Compass size={17}/></span><small>YOUR FOCUS</small><strong>{focus}</strong></div><ArrowRight size={16} aria-hidden="true"/><div><span><Target size={17}/></span><small>NEXT INVESTIGATION</small><strong>{action}</strong></div></div>
}
