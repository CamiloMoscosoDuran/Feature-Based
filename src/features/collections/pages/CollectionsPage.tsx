import React, { useState, useEffect } from 'react';
import { useCollections } from '../hooks/useCollections';
import { CollectionTable } from '../components/CollectionTable';
import { InstallmentModal } from '../components/InstallmentModal';
import { PaymentCollection } from '../types/collection.types';
import { Button } from '../../../shared/components/Button';
import { Pagination } from '../../../shared/components/Pagination';
import { usePagination } from '../../../shared/hooks/usePagination';
import { RefreshCw, Search } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const { collections, isLoading, error, reload } = useCollections();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [activeCollection, setActiveCollection] = useState<PaymentCollection | null>(null);

  const filtered = collections.filter((col) => {
    const term = searchTerm.toLowerCase();
    const id = String(col.collectionId).toLowerCase();
    const order = String(col.orderId).toLowerCase();
    const customer = (col.mongoCustomerId || '').toLowerCase();
    const matchesSearch = id.includes(term) || order.includes(term) || customer.includes(term);

    const isInactive = Boolean(col.deletedAt) || ['C', 'CANCELADO', 'INACTIVO', 'I'].includes(col.paymentStatus?.toUpperCase() || '');
    const matchesStatus =
      filterStatus === 'todos' ||
      (filterStatus === 'activos' && !isInactive) ||
      (filterStatus === 'inactivos' && isInactive);

    return matchesSearch && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
    resetPage,
  } = usePagination(filtered, { initialPageSize: 10 });

  useEffect(() => {
    resetPage();
  }, [searchTerm, filterStatus, resetPage]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Cobranzas y Cuotas</h1>
          <p className="page-subheading">
            Control financiero de pagos en cuotas asociados a las órdenes de venta (SQL Server)
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={reload}>Reintentar</Button>
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Buscar por cobranza, orden o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {(['todos', 'activos', 'inactivos'] as const).map((t) => (
            <button
              key={t}
              className={`filter-tab ${filterStatus === t ? 'filter-tab-active' : ''}`}
              onClick={() => setFilterStatus(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={15} />}
          onClick={reload}
          title="Refrescar datos"
        />
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span>Cargando cobranzas desde SQL Server...</span>
        </div>
      ) : (
        <>
          <CollectionTable
            collections={paginatedItems}
            onViewInstallments={(col) => setActiveCollection(col)}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <InstallmentModal
        collection={activeCollection}
        onClose={() => {
          setActiveCollection(null);
          reload();
        }}
      />
    </div>
  );
};
