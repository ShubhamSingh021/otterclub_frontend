import Container from "./Container.jsx";

const SectionWrapper = ({ id, children, className = "" }) => (
  <section id={id} className={`py-16 sm:py-24 ${className}`}>
    <Container>{children}</Container>
  </section>
);

export default SectionWrapper;
