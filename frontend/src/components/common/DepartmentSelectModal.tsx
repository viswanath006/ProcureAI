import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GOVT_DEPARTMENTS, GovtDepartment } from '../../data/govtDepartments';

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";

interface DepartmentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDepartment: string;
  onSelect: (department: GovtDepartment) => void;
  title?: string;
  subtitle?: string;
}

export const DepartmentSelectModal: React.FC<DepartmentSelectModalProps> = ({
  isOpen,
  onClose,
  selectedDepartment,
  onSelect,
  title = 'Select Government Department',
  subtitle = 'Official Ministries, Departments & Statutory Agencies of the Government of India',
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      setSearch('');
      setActiveCategory('All');
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(GOVT_DEPARTMENTS.map((d) => d.category)));
    return ['All', ...cats];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GOVT_DEPARTMENTS.filter((d) => {
      const matchCat = activeCategory === 'All' || d.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.ministry.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: FONT,
        animation: 'fadeIn 0.18s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        `}</style>

        {/* ── Header ── */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🏛️
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#0F172A',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: '#64748B',
                    margin: '3px 0 0',
                    lineHeight: '18px',
                  }}
                >
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              ✕
            </button>
          </div>

          {/* ── Search Input ── */}
          <div style={{ marginTop: 16, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                fontSize: 15,
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ministry, Department, or Code (e.g. Finance, CPWD, NHAI, Rail, MeitY)..."
              style={{
                width: '100%',
                height: 42,
                padding: '0 40px 0 40px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: 14,
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: FONT,
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#16A34A';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* ── Category Filter Pills ── */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              marginTop: 12,
              paddingBottom: 2,
              scrollbarWidth: 'none',
            }}
          >
            {categories.map((cat) => {
              const isCatActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    border: `1px solid ${isCatActive ? '#16A34A' : '#E2E8F0'}`,
                    backgroundColor: isCatActive ? '#DCFCE7' : '#F8FAFC',
                    color: isCatActive ? '#15803D' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    fontFamily: FONT,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── List of Departments ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            maxHeight: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>
                No matching government department found
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                Try searching for a different keyword like "Finance", "Transport", "Energy", or "Health"
              </div>
            </div>
          ) : (
            filtered.map((dept) => {
              const isSelected = selectedDepartment === dept.name;
              return (
                <div
                  key={dept.id}
                  onClick={() => {
                    onSelect(dept);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${isSelected ? '#16A34A' : '#F1F5F9'}`,
                    backgroundColor: isSelected ? '#F0FDF4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#F1F5F9';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: isSelected ? '#DCFCE7' : '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      🏛️
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected ? '#15803D' : '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {dept.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748B',
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontWeight: 500, color: '#475569' }}>{dept.ministry}</span>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: '#F1F5F9',
                            color: '#64748B',
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                          }}
                        >
                          {dept.code}
                        </span>
                        {dept.popular && (
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: 4,
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              fontSize: 9,
                              fontWeight: 600,
                            }}
                          >
                            POPULAR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    {isSelected ? (
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: '#16A34A',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#94A3B8',
                          padding: '4px 8px',
                          borderRadius: 6,
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#64748B',
          }}
        >
          <span>Showing {filtered.length} of {GOVT_DEPARTMENTS.length} official departments</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
