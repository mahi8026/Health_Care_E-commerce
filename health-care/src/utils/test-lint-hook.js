// Test file with intentional linting errors that ESLint will catch
import React from 'react'

export default function TestComponent() {
  const [count, setCount] = React.useState(0)
  
  // Missing dependency in useEffect
  React.useEffect(() => {
    console.log(count)
  }, [])
  
  return <div>{count}</div>
}
