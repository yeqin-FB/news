export const Button = ({ children, ...props }) => (
  <button
    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 
               text-white font-medium hover:from-blue-600 hover:to-purple-600 
               transition-all duration-200 transform hover:scale-105"
    {...props}
  >
    {children}
  </button>
)

export const Card = ({ children, ...props }) => (
  <div
    className="rounded-xl bg-gray-800/40 backdrop-blur-sm p-6 
               border border-gray-700 shadow-xl"
    {...props}
  >
    {children}
  </div>
)
