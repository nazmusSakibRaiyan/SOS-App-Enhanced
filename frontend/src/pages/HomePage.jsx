const HomePage = () => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5em', color: '#d9534f' }}>Emergency SOS Response System</h1>
        <p style={{ fontSize: '1.2em', color: '#555' }}>
          Your Safety, Our Priority. Fast, Reliable, and Always Ready.
        </p>
      </header>

      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '2em', color: '#d9534f', borderBottom: '2px solid #d9534f', paddingBottom: '10px' }}>
          Welcome to Your Lifeline
        </h2>
        <p style={{ fontSize: '1.1em', lineHeight: '1.6' }}>
          In critical moments, every second counts. Our Emergency SOS Response System is designed to provide
          immediate assistance when you need it most. Whether you're facing a medical emergency, a security threat,
          or any urgent situation, our platform connects you to help swiftly and efficiently.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2em', color: '#d9534f', textAlign: 'center', marginBottom: '30px' }}>
          Key Features
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <div style={featureBoxStyle}>
            <h3 style={featureTitleStyle}>Instant Alerts</h3>
            <p>Send out distress signals with a single tap, notifying emergency contacts and services immediately.</p>
          </div>
          <div style={featureBoxStyle}>
            <h3 style={featureTitleStyle}>Real-Time Location Tracking</h3>
            <p>Share your precise location with responders for quicker assistance.</p>
          </div>
          <div style={featureBoxStyle}>
            <h3 style={featureTitleStyle}>24/7 Availability</h3>
            <p>Our system is always active, ensuring you have access to help any time, anywhere.</p>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '20px', backgroundColor: '#d9534f', color: 'white', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.8em' }}>Stay Safe, Stay Connected</h2>
        <p style={{ fontSize: '1.1em' }}>
          Explore our features or sign up today to ensure you and your loved ones are protected.
        </p>
      </section>

      <footer style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <p>&copy; {new Date().getFullYear()} Emergency SOS Response System. All rights reserved.</p>
      </footer>
    </div>
  );
};

const featureBoxStyle = {
  flexBasis: '30%',
  minWidth: '250px',
  padding: '20px',
  margin: '10px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  textAlign: 'center',
  backgroundColor: 'white',
};

const featureTitleStyle = {
  fontSize: '1.4em',
  color: '#337ab7',
  marginBottom: '10px',
};



export default HomePage;
