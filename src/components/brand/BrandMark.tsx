export function BrandMark({small=false}:{small?:boolean}) {
  return <span className={`brand-mark ${small?'brand-mark-small':''}`} aria-hidden="true"><span/><span/><span/><span/></span>
}
