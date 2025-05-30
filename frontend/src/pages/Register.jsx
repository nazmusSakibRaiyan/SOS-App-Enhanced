import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, User, Phone, MapPin, ShieldCheck } from "lucide-react";
import { ClipLoader } from "react-spinners";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    nid: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Invalid email format";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.phone.match(/^\d{10,14}$/))
      newErrors.phone = "Invalid phone number";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.nid.match(/^\d{8,17}$/))
      newErrors.nid = "Invalid NID format (8-17 digits)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const baseURI = process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
      const res = await fetch(baseURI + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.log(res);
      if (res.ok) {
        toast.success("Registration successful!");
        navigate("/login");
      } else {
        const errorData = await res.json(); 
        toast.error(errorData.message || "Registration failed. Try again."); 
        console.error("Registration error:", errorData); 
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    { name: "name", label: "Full Name", icon: <User size={18} /> },
    { name: "email", label: "Email Address", icon: <Mail size={18} /> },
    { name: "password", label: "Password", icon: <Lock size={18} />, type: "password" },
    { name: "phone", label: "Phone Number", icon: <Phone size={18} /> },
    { name: "address", label: "Address", icon: <MapPin size={18} /> },
    { name: "nid", label: "National ID (NID)", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Register</h1>
        
        <form onSubmit={handleSubmit}>
          {formFields.map(({ name, label, icon, type = "text" }) => (
            <div key={name} className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {icon}
                </span>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className={`border w-full p-2 pl-10 rounded focus:outline-none ${
                    errors[name] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={label}
                />
              </div>
              {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
            </div>
          ))}

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="border w-full p-2 rounded focus:outline-none"
            >
              <option value="user">User</option>
              <option value="volunteer">Volunteer</option>
              <option value="admin">Admin</option> 
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 w-full rounded hover:bg-blue-700 transition flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <ClipLoader size={20} color="#fff" /> : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
