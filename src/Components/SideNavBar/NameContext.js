import React, { createContext, useState, useContext } from 'react';

const NameContext = createContext();

export const NameProvider = ({ children }) => {
  const [display_name, setName] = useState('');

  return (
    <NameContext.Provider value={{ display_name, setName }}>
      {children}
    </NameContext.Provider>
  );
};

export const useName = () => useContext(NameContext);
