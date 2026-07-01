import React from 'react';
import MasterDataPage from '../../components/MasterDataPage';

const CustomersPage = () => {
    return (
        <MasterDataPage 
            endpoint="/customers"
            title="Customer Management"
            idField="customer_id"
            nameField="customer_name"
            fields={[
                { name: 'customer_name', label: 'Customer Name', required: true },
                { name: 'phone', label: 'Phone' },
                { name: 'address', label: 'Address' },
            ]}
        />
    );
};

export default CustomersPage;
