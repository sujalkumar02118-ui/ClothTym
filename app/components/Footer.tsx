export default function Footer() {
  return (
    <footer className="bg-black text-white px-6 py-12 mt-10">

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        <div>
          <h2 className="text-2xl font-bold">
            CLOTHTYM
          </h2>
          <p className="text-gray-400 mt-4">
            Fashion Without Tym Limits.
            Discover trending styles with a smooth shopping experience.
          </p>
        </div>


        <div>
          <h3 className="font-bold text-lg">
            Shop
          </h3>
          <ul className="text-gray-400 mt-4 space-y-2">
            <li>Kids Wear</li>
            <li>Ladies Wear</li>
            <li>New Arrivals</li>
            <li>Trending</li>
          </ul>
        </div>


        <div>
          <h3 className="font-bold text-lg">
            Support
          </h3>
          <ul className="text-gray-400 mt-4 space-y-2">
            <li>Contact Us</li>
            <li>Shipping Policy</li>
            <li>Return Policy</li>
            <li>Privacy Policy</li>
          </ul>
        </div>


        <div>
          <h3 className="font-bold text-lg">
            Follow Us
          </h3>

          <p className="text-gray-400 mt-4">
            Instagram
          </p>

          <p className="text-gray-400 mt-2">
            Facebook
          </p>

        </div>

      </div>


      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400">
        © 2026 ClothTym. All rights reserved.
      </div>

    </footer>
  );
}