"use client";

const STATUS_DOT = "bg-gray-400";
const STATUS_LABEL = "Server offline";

export default function LiveStatus() {
  return (
    <div className="w-auto h-full flex flex-row items-center gap-2">
      <div className={`w-1.25 h-1.25 rounded-full ${STATUS_DOT}`}></div>
      <div>{STATUS_LABEL}</div>
    </div>
  );
}
