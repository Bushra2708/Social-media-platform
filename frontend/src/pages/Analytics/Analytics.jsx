import { useState, useEffect } from "react";
import { FiUsers, FiFileText, FiMessageSquare, FiSmile, FiActivity } from "react-icons/fi";

export default function Analytics() {
  const [loading, setLoading] = useState(true);

  // Dynamic metrics state
  const [stats] = useState({
    totalUsers: 142,
    totalPosts: 840,
    totalDMs: 1204,
    engagementRate: "8.4%",
    activeToday: 38,
    growthRate: "+18%"
  });

  useEffect(() => {
    // Simulate loading details
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent border-[var(--primary-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  // Data for registration chart
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full text-left space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Analytics Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">Real-time performance metrics and growth indicators for Sphere.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Members</p>
            <h3 className="text-xl font-extrabold text-[var(--text-main)] mt-0.5">{stats.totalUsers}</h3>
            <span className="text-[9px] text-emerald-500 font-bold">{stats.growthRate} this week</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <FiFileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Posts</p>
            <h3 className="text-xl font-extrabold text-[var(--text-main)] mt-0.5">{stats.totalPosts}</h3>
            <span className="text-[9px] text-[var(--primary-accent)] font-bold">~6.2 posts per user</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <FiMessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Messages Sent</p>
            <h3 className="text-xl font-extrabold text-[var(--text-main)] mt-0.5">{stats.totalDMs}</h3>
            <span className="text-[9px] text-emerald-500 font-bold">Active Socket channels</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Engagement Rate</p>
            <h3 className="text-xl font-extrabold text-[var(--text-main)] mt-0.5">{stats.engagementRate}</h3>
            <span className="text-[9px] text-emerald-500 font-bold">Outstanding ratio</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <FiSmile className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Daily</p>
            <h3 className="text-xl font-extrabold text-[var(--text-main)] mt-0.5">{stats.activeToday}</h3>
            <span className="text-[9px] text-gray-500 font-medium">Unique accounts</span>
          </div>
        </div>
      </div>

      {/* SVG Graphics Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Registration Spikes Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-main)]">User Registration Curve</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Growth rate curve plotting total registered users over 7 days.</p>
          </div>
          
          <div className="w-full aspect-video bg-black/10 rounded-2xl p-4 flex items-center justify-center">
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary-accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="450" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="50" y1="80" x2="450" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="50" y1="140" x2="450" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="50" y1="170" x2="450" y2="170" stroke="rgba(255,255,255,0.1)" />

              {/* Area Under Line */}
              <path
                d="M 50 170 L 50 156 L 116 145 L 183 135 L 250 107 L 316 87 L 383 40 L 450 20 L 450 170 Z"
                fill="url(#gradient-blue)"
              />
              
              {/* Line path */}
              <path
                d="M 50 156 Q 116 145 116 145 T 183 135 T 250 107 T 316 87 T 383 40 T 450 20"
                fill="none"
                stroke="var(--primary-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Node Circles */}
              {[
                { x: 50, y: 156, val: 10 },
                { x: 116, y: 145, val: 18 },
                { x: 183, y: 135, val: 25 },
                { x: 250, y: 107, val: 45 },
                { x: 316, y: 87, val: 60 },
                { x: 383, y: 40, val: 95 },
                { x: 450, y: 20, val: 142 }
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="5" className="fill-[#070913] stroke-[var(--primary-accent)] stroke-2" />
                  <text x={pt.x} y={pt.y - 10} textAnchor="middle" className="fill-gray-500 font-bold text-[9px]">{pt.val}</text>
                </g>
              ))}

              {/* Day Labels */}
              {days.map((day, i) => (
                <text key={i} x={50 + i * 66.6} y="190" textAnchor="middle" className="fill-gray-500 text-[9px] font-bold">
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Daily Posts Volume Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-main)]">Daily Post Volumes</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Bar chart representing new posts published on the platform per day.</p>
          </div>

          <div className="w-full aspect-video bg-black/10 rounded-2xl p-4 flex items-center justify-center">
            {/* Custom SVG Bar Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient-teal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--secondary-accent)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0.2)" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="50" y1="20" x2="450" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="50" y1="80" x2="450" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="50" y1="140" x2="450" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="50" y1="170" x2="450" y2="170" stroke="rgba(255,255,255,0.1)" />

              {/* Bars */}
              {[40, 52, 70, 64, 85, 110, 130].map((val, i) => {
                const barHeight = (val / 150) * 150; // Max height ratio
                const xCoord = 50 + i * 57 + 10;
                const yCoord = 170 - barHeight;
                return (
                  <g key={i}>
                    <rect
                      x={xCoord}
                      y={yCoord}
                      width="26"
                      height={barHeight}
                      rx="4"
                      fill="url(#gradient-teal)"
                      className="hover:opacity-90 transition-opacity"
                    />
                    <text x={xCoord + 13} y={yCoord - 8} textAnchor="middle" className="fill-gray-500 font-bold text-[9px]">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Day Labels */}
              {days.map((day, i) => (
                <text key={i} x={50 + i * 57 + 23} y="190" textAnchor="middle" className="fill-gray-500 text-[9px] font-bold">
                  {day}
                </text>
              ))}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
