import { Clapperboard, Image as ImageIcon, Film } from 'lucide-react'
import { MOTION_SCENE_SECONDS } from '@/lib/marketing/creative-plans'

export function CreativeOverview() {
  return <section className="nx-creative-overview" aria-labelledby="creative-overview-title">
    <div className="nx-creative-heading"><div><p className="nx-eyebrow">THE CREATIVE WORKFLOW WE’RE BUILDING</p><h2 id="creative-overview-title">One offer.<br/>Images and videos to match.</h2></div><p>Bring your product and your message. Our planned creative workflow connects the copy, visuals, and final edit. Image and video production are in development.</p></div>
    <div className="nx-creative-modes">
      <article><span className="nx-creative-mode-icon"><ImageIcon size={23} aria-hidden="true"/></span><p className="nx-eyebrow">01 / AD IMAGES</p><h3>Give your offer a visual.</h3><p>Product photos or AI visuals, with your headline, price, logo, and call to action. Export the same design for different placements.</p><span className="nx-creative-format">Planned output · PNG / JPG</span></article>
      <article><span className="nx-creative-mode-icon"><Film size={23}/></span><p className="nx-eyebrow">02 / PHOTO-BASED VIDEO</p><h3>Turn photos into a short ad.</h3><p>Arrange product images into scenes with movement, transitions, captions, and voiceover. A finished video, up to 30 seconds.</p><span className="nx-creative-format">Planned output · MP4</span></article>
      <article><span className="nx-creative-mode-icon"><Clapperboard size={23}/></span><p className="nx-eyebrow">03 / OPTIONAL AI MOTION</p><h3>Add movement where it matters.</h3><p>Choose separately priced {MOTION_SCENE_SECONDS}-second AI scenes and place them in a finished edit. Reusing a saved scene does not generate or charge for it again.</p><span className="nx-creative-format">Planned add-on · separate from photo-based video</span></article>
    </div>
  </section>
}
