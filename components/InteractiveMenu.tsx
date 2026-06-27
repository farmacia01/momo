import React, { useRef, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './InteractiveMenu.css';

type IconComponentType = React.ElementType<{ className?: string; size?: number | string; strokeWidth?: number | string }>;

export interface InteractiveMenuItem {
  label: string;
  href: string;
  icon: IconComponentType;
}

export interface InteractiveMenuProps {
  items: InteractiveMenuItem[];
  accentColor?: string;
}

const defaultAccentColor = '#ff6500';

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Calcula o índice ativo baseado na URL atual
  const activeIndex = useMemo(() => {
    const index = items.findIndex((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    );
    return index >= 0 ? index : 0;
  }, [items, pathname]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    // Pequeno delay para garantir que as fontes carregaram
    setTimeout(setLineWidth, 100);

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, items]);

  const handleItemClick = (index: number, href: string) => {
    router.push(href);
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]);

  return (
    <nav className="interactive-menu" role="navigation" style={navStyle}>
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <button
            key={item.href}
            className={`interactive-menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index, item.href)}
            ref={(el) => { itemRefs.current[index] = el; }}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
          >
            <div className="interactive-menu__icon">
              <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <div className="interactive-menu__text-wrapper">
              <strong
                className="interactive-menu__text"
                ref={(el) => { textRefs.current[index] = el; }}
              >
                {item.label}
              </strong>
            </div>
          </button>
        );
      })}
    </nav>
  );
};
