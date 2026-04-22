export default function MobileFrame({ children }) {
  return (
    <div className="max-w-[375px] mx-auto bg-white rounded-[36px] shadow-2xl overflow-hidden border-[8px] border-[#1a1a1a]">
      <div className="relative bg-white overflow-y-auto" style={{ height: '667px' }}>
        {children}
      </div>
    </div>
  );
}
