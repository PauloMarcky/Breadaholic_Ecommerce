import "./AddressManager.css";
import { useState, useEffect } from "react";
import axios from "axios";

export function AddressManager({ userId }) {
  const [addresses, setAddresses] = useState([]);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({
    barangay: "",
    street: "",
    landmark: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/get_user_addresses/${userId}`);
      setAddresses(res.data);
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async () => {
    if (!formData.barangay || !formData.street) {
      alert("Please fill in Barangay and Street name!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:5000/save_address", {
        user_id: userId,
        position: editingPosition,
        barangay: formData.barangay,
        street: formData.street,
        landmark: formData.landmark
      });

      alert("Address saved successfully!");
      setEditingPosition(null);
      setFormData({ barangay: "", street: "", landmark: "" });
      fetchAddresses();
    } catch (err) {
      console.error("Error saving address:", err);
      alert("Failed to save address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (position) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      await axios.post("http://127.0.0.1:5000/delete_address", {
        user_id: userId,
        position: position
      });
      alert("Address deleted successfully!");
      fetchAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
      alert("Failed to delete address");
    }
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
  const availablePositions = ['first', 'second', 'third'].filter(
    pos => !addresses.some(addr => addr.id === pos)
  );

  return (
    <div className="address-manager">
      <h3>SAVED ADDRESSES</h3>

      {/* Display saved addresses */}
      <div className="addresses-list">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <div key={address.id} className="address-item">
              <div className="address-content">
                <h5>{address.position === 1 ? "📍 Address 1" : address.position === 2 ? "📍 Address 2" : "📍 Address 3"}</h5>
                <p><strong>Barangay:</strong> {address.barangay}</p>
                <p><strong>Street:</strong> {address.street}</p>
                {address.landmark && <p><strong>Landmark:</strong> {address.landmark}</p>}
              </div>
              <div className="address-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditAddress(address)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteAddress(address.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-addresses">No saved addresses yet</p>
        )}
      </div>

      {/* Add/Edit Address Form */}
      <div className="address-form">
        <h4>
          {editingPosition
            ? `Edit Address ${addresses.find(a => a.id === editingPosition)?.position || ''}`
            : canAddMore ? "Add New Address" : "Maximum 3 addresses reached"}
        </h4>

        {editingPosition || canAddMore ? (
          <>
            <input
              type="text"
              name="barangay"
              placeholder="Barangay"
              value={formData.barangay}
              onChange={handleInputChange}
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
              <button
                className="save-btn"
                onClick={handleSaveAddress}
                disabled={isLoading}
              >
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
    </div>
  );
}