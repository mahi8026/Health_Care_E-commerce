export default function TopBar() {
  return (
    <div className="bg-[#0B2545] text-white/80 text-[11px] px-6 py-[6px] flex justify-between">
      <span>Free delivery on orders over ৳50,000 · Dhaka, Chittagong & Sylhet</span>
      <span>
        <a href="#" className="hover:text-white">Track Order</a>
        <span className="mx-2">·</span>
        <a href="#" className="hover:text-white">DGDA Info</a>
        <span className="mx-2">·</span>
        <a href="#" className="hover:text-white">Support</a>
        <span className="mx-2">·</span>
        <a href="#" className="hover:text-white">+880 1800-MED</a>
      </span>
    </div>
  );
}
