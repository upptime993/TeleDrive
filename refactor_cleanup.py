import re

with open('src/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def r(pattern, repl):
    global content
    content = re.sub(pattern, repl, content)

r(r'bg-gradient-to-tr from-slate-800 to-slate-900 border border-\[\#e5e5e5\]/50', 'bg-[#f7fff0] border-2 border-[#58cc02]')
r(r'placeholder-slate-500', 'placeholder-[#afafaf]')
r(r'border-cyan-400', 'border-[#58cc02]')
r(r'hover:bg-\[\#e5e5e5\]/60 hover:border-\[\#e5e5e5\]', 'hover:border-[#58cc02] shadow-[0_4px_0_#e5e5e5] hover:shadow-[0_4px_0_#58cc02] group')
r(r'bg-cyan-500/10', 'bg-[#d7ffb8]')
r(r'hover:text-cyan-300 hover:bg-cyan-500/10', 'hover:text-[#4ab001] hover:bg-[#d7ffb8]')
r(r'bg-cyan-500 text-slate-900', 'bg-[#58cc02] text-white')

with open('src/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
