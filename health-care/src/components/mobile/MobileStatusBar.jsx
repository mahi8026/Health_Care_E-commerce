export default function MobileStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-white">
      <div className="text-xs font-semibold">9:41</div>
      <div className="flex items-center gap-[6px]">
        <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
          <path d="M1 5.5C1 3.567 2.567 2 4.5 2h7C13.433 2 15 3.567 15 5.5v1c0 1.933-1.567 3.5-3.5 3.5h-7C2.567 10 1 8.433 1 6.5v-1z" stroke="currentColor" strokeWidth="1" fill="none"/>
          <path d="M15.5 4.5v3c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5z" fill="currentColor"/>
        </svg>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.5 1a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5zm-7 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5zm3.5 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2a.5.5 0 0 1 .5-.5z"/>
          <path d="M2 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z"/>
        </svg>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0zM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z"/>
          <path d="M8 4.5a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3.5a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5z"/>
        </svg>
      </div>
    </div>
  );
}
