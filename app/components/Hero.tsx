export default function Hero() {
  return (
    <section className="px-6 py-16 bg-black text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10">

        <div className="flex-1">

          <p className="text-sm tracking-[4px] text-gray-400 uppercase">
            CLOTHTYM FASHION
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px w-10 bg-white"></span>
            <span className="text-sm text-gray-300">
              Premium Fashion • Seamless Delivery
            </span>
          </div>

          <h1 className="text-5xl font-bold mt-6 leading-tight">
            Fashion Without
            <br />
            Tym Limits
          </h1>

          <p className="text-gray-300 mt-5 text-lg">
            Discover premium styles with a smooth shopping experience
            and reliable doorstep delivery.
          </p>

          <button className="mt-8 bg-white text-black px-8 py-3 rounded-full font-semibold">
            Shop Now
          </button>

        </div>


        <div className="flex-1">
          <div className="h-80 rounded-3xl bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-lg">
              Fashion Banner Image
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}