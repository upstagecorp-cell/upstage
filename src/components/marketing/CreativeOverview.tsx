import Link from 'next/link'
import { ArrowRight, Clapperboard, Image as ImageIcon, Film } from 'lucide-react'
import { MOTION_SCENE_SECONDS } from '@/lib/marketing/creative-plans'

export function CreativeOverview() {
  return <section className="nx-creative-overview" aria-labelledby="creative-overview-title">
    <div className="nx-creative-heading"><div><p className="nx-eyebrow">YOUR PRODUCT. YOUR CREATIVE WORK.</p><h2 id="creative-overview-title">One offer.<br />A clearer picture.</h2></div><p>Photo-based image tools are implemented in the workspace. We’re building toward connected campaign kits with AI visuals and finished videos. New creative purchases remain closed.</p></div>
    <div className="nx-creative-modes">
      <article><span className="nx-creative-mode-icon"><ImageIcon size={23} aria-hidden="true" /></span><p className="nx-eyebrow">01 / PHOTO-BASED IMAGES</p><h3>Start with your own product.</h3><p>Upload photos and a logo privately. Save your headline, price, and call to action as a design, then approve the exact version. PNG/JPG export requires creative rights and an available image worker.</p><span className="nx-creative-format">Implemented image tools · conditional export</span><Link href="/product#image-studio" className="nx-platform-text-link">Explore images & files <ArrowRight size={13} /></Link></article>
      <article><span className="nx-creative-mode-icon"><Film size={23} aria-hidden="true" /></span><p className="nx-eyebrow">02 / PHOTO-BASED VIDEO</p><h3>Turn photos into a short ad.</h3><p>The planned workflow arranges product images into scenes with movement, captions, and voiceover. Finished MP4 videos up to 30 seconds are still in development.</p><span className="nx-creative-format">Planned output · MP4 · not available</span></article>
      <article><span className="nx-creative-mode-icon"><Clapperboard size={23} aria-hidden="true" /></span><p className="nx-eyebrow">03 / AI VISUALS & MOTION</p><h3>Add a different perspective.</h3><p>AI-generated images and separately priced {MOTION_SCENE_SECONDS}-second motion scenes are planned features. The current image tool uses uploaded photos and does not call an AI visual provider.</p><span className="nx-creative-format">Planned AI features · not available</span></article>
    </div>
  </section>
}
