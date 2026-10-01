import {useState} from 'react';
import catalog from './catalog.json';

export function TalkCraftGallery({onBack,onOpenProject}: {onBack: () => void;onOpenProject?:()=>void}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [selected, setSelected] = useState<string | null>(null);
  const shown = catalog.filter(card => (category === '全部' || card.category === category)
    && `${card.title} ${card.slug} ${card.oneliner} ${card.semantics.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const active = catalog.find(card => card.slug === selected);
  return <main className="shell">
    <button className="back" onClick={onBack}>打开口播项目审阅</button>
    {onOpenProject&&<button style={{float:'right'}} onClick={onOpenProject}>返回项目审阅</button>}
    <p className="eyebrow">JIANJIPRO · TALKCRAFT</p>
    <h1>TalkCraft 模板库</h1>
    <p className="description">{catalog.length} 张动效模板，按用途找效果。已有 {catalog.filter(c => c.adapter).length} 张实拍适配卡；其余模板可参考、修改后接入制作。</p>
    <div className="tc-filters">
      <input aria-label="搜索 TalkCraft 模板" placeholder="搜索：标题、并列、步骤、截图…" value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label="模板类别" value={category} onChange={e => setCategory(e.target.value)}>
        {['全部', ...new Set(catalog.map(c => c.category))].map(c => <option key={c}>{c}</option>)}
      </select><span>{shown.length} 个结果</span>
    </div>
    {active && <section className="tc-demo">
      <div><h2>{active.title}</h2><button onClick={() => setSelected(null)}>关闭预览</button></div>
      <iframe title={`${active.title} 动效预览`} src={active.demo_url} sandbox="allow-scripts allow-same-origin" />
      <p className="description">预览使用上游演示内容；真实制作时替换为你的文案和素材。</p>
    </section>}
    <section className="grid">{shown.map(card => <article className="card tc-card" key={card.slug}>
      <p className="eyebrow">{card.category} · {card.adapter ? '实拍适配' : '模板参考'}</p>
      <h2>{card.title}</h2><p className="description">{card.oneliner}</p>
      <p>{card.semantics.join(' · ')}</p><button onClick={() => setSelected(card.slug)}>查看动效</button>
    </article>)}</section>
  </main>;
}
