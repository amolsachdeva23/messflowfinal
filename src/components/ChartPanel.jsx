import { ResponsiveContainer } from 'recharts';
import Panel from '@/components/Panel';
import { cn } from '@/lib/utils';

export default function ChartPanel({ title, subtitle, actions, height = 240, children, footer, className }) {
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      actions={actions}
      footer={footer}
      className={cn('flex flex-col', className)}
      bodyClassName="flex-1"
    >
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}