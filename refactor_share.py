import re

with open(r'src\app\share\[token]\SharePageClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def r(pattern, repl):
    global content
    content = re.sub(pattern, repl, content)

r(r'bg-\[\#0f172a\]', 'bg-[#f7f7f7]')
r(r'bg-\[\#060a16\]/80 backdrop-blur-md', 'bg-white border-b-2 border-[#e5e5e5]')
r(r'text-white', 'text-[#3c3c3c]')
r(r'text-slate-400', 'text-[#777777]')
r(r'text-slate-500', 'text-[#afafaf]')
r(r'text-slate-600', 'text-[#afafaf]')
r(r'text-slate-300', 'text-[#3c3c3c]')
r(r'text-cyan-400', 'text-[#58cc02]')
r(r'text-cyan-300', 'text-[#4ab001]')
r(r'bg-gradient-to-tr from-cyan-400 to-blue-600', 'bg-[#58cc02]')
r(r'shadow-\[0_0_15px_rgba\(6,182,212,0\.25\)\]', 'shadow-[0_4px_0_#3f8f01]')
r(r'group-hover:shadow-\[0_0_20px_rgba\(6,182,212,0\.4\)\]', 'group-hover:shadow-[0_4px_0_#3f8f01]')
r(r'border-slate-800/60', 'border-[#e5e5e5]')
r(r'border-slate-800/80', 'border-[#e5e5e5]')
r(r'border-slate-700/50', 'border-[#e5e5e5]')
r(r'border-slate-800', 'border-[#e5e5e5]')
r(r'border-slate-700', 'border-[#e5e5e5]')
r(r'bg-slate-900/60', 'bg-white')
r(r'bg-slate-800/80', 'bg-[#f7fff0]')
r(r'bg-slate-800/60', 'bg-[#f7f7f7]')
r(r'bg-slate-800', 'bg-[#f7f7f7]')
r(r'bg-slate-700', 'bg-[#e5e5e5]')
r(r'border-t-cyan-500', 'border-t-[#58cc02]')
r(r'text-amber-400', 'text-[#ffc800]')
r(r'text-rose-400', 'text-[#ff4b4b]')
r(r'bg-rose-500/10', 'bg-[#ffdfe0]')
r(r'bg-gradient-to-b from-cyan-500/5 to-transparent', '')
r(r'bg-cyan-500/20 border border-cyan-500/30', 'bg-[#f7fff0] border-2 border-[#58cc02]')
r(r'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400', 'bg-[#d7ffb8] border-2 border-[#58cc02] text-[#58cc02]')
r(r'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-\[0_0_30px_rgba\(6,182,212,0\.35\)\] hover:shadow-\[0_0_40px_rgba\(6,182,212,0\.5\)\] active:scale-\[0\.98\]', 'bg-[#58cc02] hover:bg-[#4ab001] text-white shadow-[0_6px_0_#3f8f01] active:translate-y-[6px] active:shadow-none')

with open(r'src\app\share\[token]\SharePageClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
