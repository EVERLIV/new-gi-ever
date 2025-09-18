import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon, ArrowRightOnRectangleIcon } from '../components/icons/IconComponents';

const DATA_KEYS = [
    'everliv_health_biomarkers',
    'everliv_health_test_history',
    'everliv_health_alerts'
];

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleExportData = () => {
        try {
            const dataToExport: { [key: string]: any } = {};
            DATA_KEYS.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    dataToExport[key] = JSON.parse(item);
                }
            });

            if (Object.keys(dataToExport).length === 0) {
                alert('No data found to export.');
                return;
            }

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `everliv_health_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error exporting data:", error);
            alert('An error occurred while exporting your data.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm('Are you sure you want to import this data? This will overwrite your current data.')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('File could not be read');
                }
                const importedData = JSON.parse(text);

                // Validate and set data
                let importedKeysCount = 0;
                DATA_KEYS.forEach(key => {
                    if (importedData[key]) {
                        localStorage.setItem(key, JSON.stringify(importedData[key]));
                        importedKeysCount++;
                    }
                });

                if (importedKeysCount > 0) {
                    alert('Data imported successfully! The application will now reload.');
                    window.location.reload();
                } else {
                    alert('The selected file does not contain valid Everliv Health data.');
                }

            } catch (error) {
                console.error("Error importing data:", error);
                alert('An error occurred while importing the data. Please ensure the file is a valid JSON backup.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input value to allow importing the same file again
        event.target.value = '';
    };

    const handleClearData = () => {
        if (window.confirm('Are you absolutely sure you want to delete all your data? This action cannot be undone.')) {
            DATA_KEYS.forEach(key => localStorage.removeItem(key));
            alert('All your data has been cleared. The application will now reload.');
            window.location.reload();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Profile & Settings</h1>
                <p className="text-on-surface-variant mt-1">Manage your account and application data.</p>
            </div>
            
            <Card>
                <h2 className="text-lg font-semibold text-on-surface">Account Information</h2>
                <div className="mt-4 flex items-center space-x-4">
                    <img src={user.avatarUrl} alt="User avatar" className="w-16 h-16 rounded-full"/>
                    <div>
                        <p className="font-bold text-on-surface">{user.name}</p>
                        <p className="text-sm text-on-surface-variant">{user.email}</p>
                    </div>
                </div>
                 <div className="mt-6 border-t pt-6">
                     <Button onClick={handleLogout} variant="secondary" leftIcon={<ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />}>
                        Logout
                    </Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold text-on-surface">Data Management</h2>
                <p className="text-sm text-on-surface-variant mt-1">Export a backup of your data or import from a file. All data is stored locally in your browser.</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={handleExportData} variant="secondary" leftIcon={<ArrowDownTrayIcon className="h-5 w-5 mr-2" />}>
                        Export My Data
                    </Button>
                    <Button onClick={handleImportClick} variant="secondary" leftIcon={<ArrowUpTrayIcon className="h-5 w-5 mr-2" />}>
                        Import Data
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json"/>
                </div>
            </Card>
            
            <Card>
                <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <p className="font-medium text-on-surface">Clear All Data</p>
                        <p className="text-sm text-on-surface-variant mt-1">Permanently remove all your health data from this browser.</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex-shrink-0">
                        <Button onClick={handleClearData} variant="danger" leftIcon={<TrashIcon className="h-5 w-5 mr-2" />}>
                            Clear All My Data
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProfilePage;
