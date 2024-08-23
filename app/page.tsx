'use client'

import { z } from 'zod'
import { init, tx, id } from '@instantdb/react'

// ID for app: Fountain
const APP_ID = '894b7dd3-f444-4352-bc6c-69f1cc9ee541'

const WishSchema = z.object({
  id: z.string(),
  text: z.string().max(42),
  locationX: z.number().min(0).max(100),
  locationY: z.number().min(0).max(100),
  ipAddress: z.string().ip(),
  createdAt: z.number(),
})

// Types
// ----------
type Wish = z.infer<typeof WishSchema>

type Schema = {
  wishes: Wish
}

const db = init<Schema>({ appId: APP_ID })

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({
    wishes: {
      $: {
        limit: 50,
        order: {
          serverCreatedAt: 'desc',
        }
      },
    },
  })
  if (isLoading) {
    return <div>Loading Wishes...</div>
  }
  if (error) {
    console.log(error)
    return <div>Oops, please try again later</div>
  }
  const { wishes } = data
  return (
    <div>
      <Wishes wishes={wishes} />
      <WishForm />
    </div>
  )
}

// Write Data
// ---------
async function addWish(text: string) {
  // Generate percentage random location upto 4 digits, like 23.54 or 76.89
  const locationX = Math.floor(Math.random() * 10000) / 100
  const locationY = Math.floor(Math.random() * 10000) / 100
  const ipAddress = (await (await fetch('https://api.ipify.org?format=json')).json()).ip
  const wish = WishSchema.parse({
    id: id(),
    text,
    locationX,
    locationY,
    ipAddress,
    createdAt: Date.now(),
  })
  db.transact(tx.wishes[wish.id].update(wish))
}

// Components
// ----------
function WishForm() {
  return (
    <div style={styles.form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addWish(e.target[0].value)
          e.target[0].value = ''
        }}
      >
        <input
          style={styles.input}
          autoFocus
          placeholder="What do you really want?"
          type="text"
        />
      </form>
    </div>
  )
}

function Wishes({ wishes }: { wishes: Wish[] }) {
  return (
    <div style={styles.container}>
      {wishes
        .filter((wish) => {
          try {
            WishSchema.parse(wish)
            return true
          } catch (e) {
            return false
          }
        })
        .map((wish) => (
          <div
            key={wish.id}
            style={{
              ...styles.wish,
              left: `${wish.locationX}%`,
              top: `${wish.locationY}%`,
            }}
          >
            <span>{wish.text}</span>
          </div>
        ))}
    </div>
  )
}


// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
  container: {
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    fontFamily: 'Apple Garamond, Garamond, Georgia, serif',
    height: '100vh',
    width: '100vw',
    position: 'relative',
    background: 'skyblue',
  },
  form: {
    boxSizing: 'inherit',
    display: 'flex',
    width: '350px',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  input: {
    fontFamily: 'Apple Garamond, Garamond, Georgia, serif',
    width: '287px',
    padding: '10px',
    fontStyle: 'italic',
    border: '1px solid lightgray',
    borderRadius: '10px',
    background: 'white',
  },
  wish: {
    padding: '10px',
    border: '1px solid lightgray',
    backgroundColor: 'white',
    borderRadius: '10px',
    opacity: 0.5,
    position: 'absolute',
    cursor: 'pointer',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    transition: 'opacity 0.2s ease-in-out',
    fontSize: '14px',
  },
}

export default App