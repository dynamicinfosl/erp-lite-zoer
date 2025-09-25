export default function TestePage() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue', minHeight: '100vh' }}>
      <h1 style={{ color: 'darkblue', fontSize: '32px' }}>PÁGINA DE TESTE FUNCIONANDO</h1>
      <p style={{ fontSize: '18px' }}>Se você está vendo esta página, o roteamento básico funciona!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}


