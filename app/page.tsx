import { Hero } from '@/components/sections/Hero';
import { ProjectSlider } from '@/components/sections/ProjectSlider';
import { ProjectSpace } from '@/components/sections/ProjectSpace';
import { Capabilities } from '@/components/sections/Capabilities';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Divider />
      <ProjectSlider />
      <Divider />
      <ProjectSpace />
      <Divider />
      <Capabilities />
      <Divider />
      <About />
      <Divider />
      <Contact />
    </>
  );
}

function Divider() {
  return (
    <div className="relative z-10 container-x">
      <div className="rule" />
    </div>
  );
}
