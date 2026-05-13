import "./AddressManager.css";
import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

export function AddressManager({ userId, onShowMessage, onAddressUpdate }) {
  const [addresses, setAddresses] = useState([]);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({
    barangay: "",
    street: "",
    landmark: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    position: null
  });

  const barangayOptions = [
    { value: "Calao East", label: "Calao East" },
    { value: "Calaocan", label: "Calaocan" },
    { value: "Calao West", label: "Calao West" },
    { value: "Dubinan East", label: "Dubinan East" },
    { value: "Dubinan West", label: "Dubinan West" },
    { value: "Patul", label: "Patul" },
    { value: "Plaridel", label: "Plaridel" },
    { value: "Rosario", label: "Rosario" },
    { value: "Sinsayon", label: "Sinsayon" },
    { value: "Victory Norte", label: "Victory Norte" },
    { value: "Victory Sur", label: "Victory Sur" },
    { value: "Villasis", label: "Villasis" },
  ];

  const handleSelectChange = (selectedOption) => {
    setFormData({ ...formData, barangay: selectedOption.value });
  };

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`http://192.168.1.102:5000/get_user_addresses/${userId}`);
      setAddresses(res.data);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      onShowMessage?.("Failed to load addresses", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async () => {
    if (!formData.barangay || !formData.street) {
      onShowMessage?.("Please fill in Barangay and Street name!", "error");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://192.168.1.102:5000/save_address", {
        user_id: userId,
        position: editingPosition,
        barangay: formData.barangay,
        street: formData.street,
        landmark: formData.landmark
      });

      onShowMessage?.("Address saved successfully!", "success");
      setEditingPosition(null);
      setFormData({ barangay: "", street: "", landmark: "" });
      await fetchAddresses();
      onAddressUpdate?.();
    } catch (err) {
      console.error("Error saving address:", err);
      onShowMessage?.("Failed to save address", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const requestDeleteAddress = (position) => {
    setDeleteConfirm({ show: true, position });
  };

  const handleDeleteAddress = async () => {
    if (!deleteConfirm.position) return;

    setIsLoading(true);
    try {
      await axios.post("http://192.168.1.102:5000/delete_address", {
        user_id: userId,
        position: deleteConfirm.position
      });
      onShowMessage?.("Address deleted successfully!", "success");
      await fetchAddresses();
      onAddressUpdate?.();
    } catch (err) {
      console.error("Error deleting address:", err);
      onShowMessage?.("Failed to delete address", "error");
    } finally {
      setIsLoading(false);
      setDeleteConfirm({ show: false, position: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, position: null });
  };

  const handleEditAddress = (address) => {
    setEditingPosition(address.id);
    setFormData({
      barangay: address.barangay,
      street: address.street,
      landmark: address.landmark
    });
  };

  const canAddMore = addresses.length < 3;

  return (
    <div className="address-manager">
      <h3>SAVED ADDRESSES</h3>

      <div className="addresses-list">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <div key={address.id} className="address-item">
              <div className="address-content">
                {/* ✅ Label position 1 as "Main Address" */}
                <h5>
                  {address.position === 1
                    ? "Main Address"
                    : address.position === 2
                      ? "Address 2"
                      : "Address 3"}
                </h5>
                <p><strong>Barangay:</strong> {address.barangay}</p>
                <p><strong>Street:</strong> {address.street}</p>
                {address.landmark && <p><strong>Landmark:</strong> {address.landmark}</p>}
              </div>
              <div className="address-actions">
                <button className="edit-btn" onClick={() => handleEditAddress(address)}>
                  Edit
                </button>
                {/* ✅ FIX: Hide Delete button for Main Address (position 1) — edit only */}
                {address.position !== 1 && (
                  <button className="delete-btn" onClick={() => requestDeleteAddress(address.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-addresses">No saved addresses yet</p>
        )}
      </div>

      <div className="address-form">
        <h4>
          {editingPosition
            ? `Edit ${addresses.find(a => a.id === editingPosition)?.position === 1
              ? "Main Address"
              : `Address ${addresses.find(a => a.id === editingPosition)?.position}`}`
            : canAddMore
              ? "Add New Address"
              : "Maximum 3 addresses reached"}
        </h4>

        {editingPosition || canAddMore ? (
          <>
            <Select
              options={barangayOptions}
              placeholder="Select Barangay"
              maxMenuHeight={150}
              onChange={handleSelectChange}
              classNamePrefix="reactSelectAddressManager"
              value={formData.barangay
                ? { value: formData.barangay, label: formData.barangay }
                : null}
              styles={{
                placeholder: (base) => ({
                  ...base,
                  fontSize: '0.9rem',
                  color: 'var(--text-dark)',
                  opacity: 0.6,
                })
              }}
            />
            <input
              type="text"
              name="street"
              placeholder="Street Name"
              value={formData.street}
              onChange={handleInputChange}
            />
            <textarea
              name="landmark"
              placeholder="Landmark (optional)"
              value={formData.landmark}
              onChange={handleInputChange}
            />

            <div className="form-buttons">
              <button className="save-btn" onClick={handleSaveAddress} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Address"}
              </button>
              {editingPosition && (
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setEditingPosition(null);
                    setFormData({ barangay: "", street: "", landmark: "" });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="confirm-modal-overlay" onClick={cancelDelete}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h4>Confirm Delete</h4>
              <button className="confirm-modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="confirm-modal-body">
              <p>Are you sure you want to delete this address?</p>
              <p className="confirm-modal-subtext">This action cannot be undone.</p>
            </div>
            <div className="confirm-modal-actions">
              <button className="confirm-cancel" onClick={cancelDelete} disabled={isLoading}>
                Cancel
              </button>
              <button className="confirm-delete" onClick={handleDeleteAddress} disabled={isLoading}>
                {isLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}