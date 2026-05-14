const Container = ({ children, className = "" }) => (
  <div className={`mx-auto w-full max-w-[1280px] px-4 sm:px-8 ${className}`}>{children}</div>
);

export default Container;
