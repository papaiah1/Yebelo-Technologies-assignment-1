import React from 'react';

interface Props {
  tokens: string[];
  selected: string;
  onChange: (token: string) => void;
}

export const TokenSelector: React.FC<Props> = ({ tokens, selected, onChange }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label>Select Token: </label>
      <select value={selected} onChange={e => onChange(e.target.value)}>
        {tokens.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
};
