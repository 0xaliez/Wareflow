import React from 'react';
import MasterDataPage from '../../components/MasterDataPage';

const SuppliersPage = () => {
    return (
        <MasterDataPage 
            endpoint="/suppliers"
            title="Supplier Directory"
            idField="supplier_id"
            nameField="supplier_name"
            canDeactivate={true}
            fields={[
                { name: 'supplier_name', label: 'Supplier Name', required: true },
                { name: 'email', label: 'Email' },
                { name: 'phone', label: 'Phone' },
                { name: 'address', label: 'Address' },
            ]}
        />
    );
};

export default SuppliersPage;
