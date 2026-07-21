import { useState } from 'react'
import axios from 'axios'
import { playClickSound } from '../lib/sound'
import createPlaceholderSession from '../lib/createPlaceholderSession'
import LinkRow from '../components/LinkRow'
import JoinInfoPopup from '../components/JoinInfoPopup'
import type { Links, Session } from '../types'

function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-20">
      <h1 className="text-5xl font-extrabold tracking-tight text-emerald-400">
        Slime Volleyball
      </h1>
      <p className="mt-3 text-neutral-500">Host a match, share a link, start playing.</p>

      <div className="mt-16 w-full max-w-sm">
        {!session ? (
          <button
            onClick={() => {
              playClickSound()
              setIsPopupOpen(true)
            }}
            className="w-full cursor-pointer rounded-full bg-amber-200 px-8 py-4 font-semibold text-neutral-800 shadow-sm transition-all duration-150 hover:scale-105 hover:bg-amber-300 hover:shadow-md active:scale-95 active:bg-amber-400 active:shadow-sm"
          >
            Create Session
          </button>
        ) : (
          <div className="space-y-3">
            <LinkRow label="Your host link" value={session.hostLink} />
            <LinkRow label="Share with players" value={session.joinLink} />
            {session.courtName && (
              <p className="text-center text-sm text-neutral-400">
                Court: {session.courtName}
              </p>
            )}
            <p className="text-center text-sm text-neutral-400">
              Capacity: {session.capacity} players
            </p>
            <p className="text-center text-sm text-neutral-400">
              {session.date}, {session.startTime}–{session.endTime}
            </p>
            <p className="text-center text-sm text-neutral-400">
              Price: ${session.price.toFixed(2)}
            </p>
            <button
              onClick={() => setSession(null)}
              className="mx-auto block pt-2 text-sm text-neutral-400 underline hover:text-neutral-600"
            >
              Start over
            </button>
          </div>
        )}
      </div>

      {isPopupOpen && (
        <JoinInfoPopup
          onClose={() => setIsPopupOpen(false)}
          onSubmit={async (email, username, capacity, date, startTime, endTime, price, courtName) => {
            const session_details = {capacity, date, startTime, endTime, price, email, username, courtName};
            const links = (await axios.post("/api/session/create", session_details)).data;
            setSession(createPlaceholderSession(capacity, date, startTime, endTime, price, links.host_link, links.join_link, courtName))
            setIsPopupOpen(false)
          }}
        />
      )}
    </div>
  )
}

// Not working links aren't connecting to front end. 
// That's it rn. 

export default HomePage
