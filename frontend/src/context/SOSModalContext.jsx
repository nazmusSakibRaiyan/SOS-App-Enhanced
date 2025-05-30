import { createContext, useContext, useState } from "react";

const SOSModalContext = createContext();

export const useSOSModal = () => useContext(SOSModalContext);

export const SOSModalProvider = ({ children }) => {
	const [sosData, setSOSData] = useState(null);

	const showSOSModal = (data) => setSOSData(data);
	const hideSOSModal = () => setSOSData(null);

	return (
		<SOSModalContext.Provider
			value={{ sosData, showSOSModal, hideSOSModal }}
		>
			{children}
		</SOSModalContext.Provider>
	);
};
