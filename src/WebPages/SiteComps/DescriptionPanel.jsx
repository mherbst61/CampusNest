export default function DescriptionPanel({
  items = [],
  activeIndex = 0,
  extractText = (x) => x?.description || "",
  heightClass = "h-40",
  rounded = "rounded-md",
}) {
  const text = items[activeIndex] ? (extractText(items[activeIndex]) || "") : "";
  return (
    <div className={`w-full ${heightClass} ${rounded} border p-3 overflow-auto text-sm leading-6`}>
      {text || <span className="text-gray-500">No description</span>}
    </div>
  );
}
