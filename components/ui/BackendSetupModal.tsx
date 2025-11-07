import React from 'react';

// This component is obsolete as the application is configured to use Firebase.
// It has been disabled to prevent it from blocking the application load.
const BackendSetupModal: React.FC<{ onSave: (url: string) => void; }> = () => {
    return null;
};

export default BackendSetupModal;
