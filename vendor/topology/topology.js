// \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
// node_modules/jsts/hasInterface.js
function hasInterface_default(o, i) {
	return o.interfaces_ && o.interfaces_.indexOf(i) > -1;
}
// node_modules/jsts/org/locationtech/jts/util/NumberUtil.js
var NumberUtil = class {
	static equalsWithTolerance(x1, x2, tolerance) {
		return Math.abs(x1 - x2) <= tolerance;
	}
};
// node_modules/jsts/java/lang/Exception.js
var Exception = class Exception extends Error {
	constructor(message) {
		super(message);
		this.name = Object.keys({ Exception })[0];
	}
	toString() {
		return this.message;
	}
};
// node_modules/jsts/java/lang/IllegalArgumentException.js
var IllegalArgumentException = class IllegalArgumentException extends Exception {
	constructor(message) {
		super(message);
		this.name = Object.keys({ IllegalArgumentException })[0];
	}
};
// node_modules/jsts/java/lang/Long.js
var Long = class {
	constructor(high, low) {
		this.low = low || 0;
		this.high = high || 0;
	}
	static toBinaryString(i) {
		let mask;
		let result = "";
		for (mask = 2147483648; mask > 0; mask >>>= 1) result += (i.high & mask) === mask ? "1" : "0";
		for (mask = 2147483648; mask > 0; mask >>>= 1) result += (i.low & mask) === mask ? "1" : "0";
		return result;
	}
};
// node_modules/jsts/java/lang/Double.js
function Double() {}
Double.NaN = NaN;
Double.isNaN = (n) => Number.isNaN(n);
Double.isInfinite = (n) => !Number.isFinite(n);
Double.MAX_VALUE = Number.MAX_VALUE;
Double.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
Double.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
if (typeof Float64Array === "function" && typeof Int32Array === "function") (function() {
	const EXP_BIT_MASK = 2146435072;
	const SIGNIF_BIT_MASK = 1048575;
	const f64buf = /* @__PURE__ */ new Float64Array(1);
	const i32buf = new Int32Array(f64buf.buffer);
	Double.doubleToLongBits = function(value) {
		f64buf[0] = value;
		let low = i32buf[0] | 0;
		let high = i32buf[1] | 0;
		if ((high & EXP_BIT_MASK) === EXP_BIT_MASK && (high & SIGNIF_BIT_MASK) !== 0 && low !== 0) {
			low = 0;
			high = 2146959360;
		}
		return new Long(high, low);
	};
	Double.longBitsToDouble = function(bits) {
		i32buf[0] = bits.low;
		i32buf[1] = bits.high;
		return f64buf[0];
	};
})();
else (function() {
	const BIAS = 1023;
	const log2 = Math.log2;
	const floor = Math.floor;
	const pow = Math.pow;
	const MAX_REL_BITS_INTEGER = (function() {
		for (let i = 53; i > 0; i--) {
			const bits = pow(2, i) - 1;
			if (floor(log2(bits)) + 1 === i) return bits;
		}
		return 0;
	})();
	Double.doubleToLongBits = function(value) {
		let x, y, f, bits, skip;
		let sign, exp, high, low;
		if (value < 0 || 1 / value === Number.NEGATIVE_INFINITY) {
			sign = 1 << 31;
			value = -value;
		} else sign = 0;
		if (value === 0) {
			low = 0;
			high = sign;
			return new Long(high, low);
		}
		if (value === Infinity) {
			low = 0;
			high = sign | 2146435072;
			return new Long(high, low);
		}
		if (value !== value) {
			low = 0;
			high = 2146959360;
			return new Long(high, low);
		}
		bits = 0;
		low = 0;
		x = floor(value);
		if (x > 1) if (x <= MAX_REL_BITS_INTEGER) {
			bits = floor(log2(x));
			if (bits <= 20) {
				low = 0;
				high = x << 20 - bits & 1048575;
			} else {
				f = bits - 20;
				y = pow(2, f);
				low = x % y << 32 - f;
				high = x / y & 1048575;
			}
		} else {
			f = x;
			low = 0;
			for (;;) {
				y = f / 2;
				f = floor(y);
				if (f === 0) break;
				bits++;
				low >>>= 1;
				low |= (high & 1) << 31;
				high >>>= 1;
				if (y !== f) high |= 524288;
			}
		}
		exp = bits + BIAS;
		skip = x === 0;
		x = value - x;
		if (bits < 52 && x !== 0) {
			f = 0;
			for (;;) {
				y = x * 2;
				if (y >= 1) {
					x = y - 1;
					if (!skip) {
						f <<= 1;
						f |= 1;
						bits++;
					} else {
						exp--;
						skip = false;
					}
				} else {
					x = y;
					if (!skip) {
						f <<= 1;
						bits++;
					} else if (--exp === 0) {
						bits++;
						skip = false;
					}
				}
				if (bits === 20) {
					high |= f;
					f = 0;
				} else if (bits === 52) {
					low |= f;
					break;
				}
				if (y === 1) {
					if (bits < 20) high |= f << 20 - bits;
					else if (bits < 52) low |= f << 52 - bits;
					break;
				}
			}
		}
		high |= exp << 20;
		high |= sign;
		return new Long(high, low);
	};
	Double.longBitsToDouble = function(bits) {
		let i;
		let x, exp, fract;
		const high = bits.high;
		const low = bits.low;
		const sign = high & 1 << 31 ? -1 : 1;
		exp = ((high & 2146435072) >> 20) - BIAS;
		fract = 0;
		x = 1 << 19;
		for (i = 1; i <= 20; i++) {
			if (high & x) fract += pow(2, -i);
			x >>>= 1;
		}
		x = 1 << 31;
		for (i = 21; i <= 52; i++) {
			if (low & x) fract += pow(2, -i);
			x >>>= 1;
		}
		if (exp === -1023) {
			if (fract === 0) return sign * 0;
			exp = -1022;
		} else if (exp === 1024) {
			if (fract === 0) return sign / 0;
			return NaN;
		} else fract += 1;
		return sign * fract * pow(2, exp);
	};
})();
// node_modules/jsts/java/lang/Comparable.js
function Comparable() {}
// node_modules/jsts/java/io/Serializable.js
function Serializable() {}
// node_modules/jsts/java/lang/RuntimeException.js
var RuntimeException = class RuntimeException extends Exception {
	constructor(message) {
		super(message);
		this.name = Object.keys({ RuntimeException })[0];
	}
};
// node_modules/jsts/org/locationtech/jts/util/AssertionFailedException.js
var AssertionFailedException = class AssertionFailedException extends RuntimeException {
	constructor() {
		super();
		AssertionFailedException.constructor_.apply(this, arguments);
	}
	static constructor_() {
		if (arguments.length === 0) RuntimeException.constructor_.call(this);
		else if (arguments.length === 1) {
			const message = arguments[0];
			RuntimeException.constructor_.call(this, message);
		}
	}
};
// node_modules/jsts/org/locationtech/jts/util/Assert.js
var Assert = class Assert {
	static isTrue() {
		if (arguments.length === 1) {
			const assertion = arguments[0];
			Assert.isTrue(assertion, null);
		} else if (arguments.length === 2) {
			const assertion = arguments[0], message = arguments[1];
			if (!assertion) if (message === null) throw new AssertionFailedException();
			else throw new AssertionFailedException(message);
		}
	}
	static shouldNeverReachHere() {
		if (arguments.length === 0) Assert.shouldNeverReachHere(null);
		else if (arguments.length === 1) {
			const message = arguments[0];
			throw new AssertionFailedException("Should never reach here" + (message !== null ? ": " + message : ""));
		}
	}
	static equals() {
		if (arguments.length === 2) {
			const expectedValue = arguments[0], actualValue = arguments[1];
			Assert.equals(expectedValue, actualValue, null);
		} else if (arguments.length === 3) {
			const expectedValue = arguments[0], actualValue = arguments[1], message = arguments[2];
			if (!actualValue.equals(expectedValue)) throw new AssertionFailedException("Expected " + expectedValue + " but encountered " + actualValue + (message !== null ? ": " + message : ""));
		}
	}
};
// node_modules/jsts/java/lang/Cloneable.js
function Clonable() {}
// node_modules/jsts/java/util/Comparator.js
function Comparator() {}
// node_modules/jsts/org/locationtech/jts/geom/Coordinate.js
var kBuf = /* @__PURE__ */ new ArrayBuffer(8);
var kBufAsF64 = new Float64Array(kBuf);
var kBufAsI32 = new Int32Array(kBuf);
var Coordinate = class Coordinate {
	constructor() {
		Coordinate.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.x = null;
		this.y = null;
		this.z = null;
		if (arguments.length === 0) Coordinate.constructor_.call(this, 0, 0);
		else if (arguments.length === 1) {
			const c = arguments[0];
			Coordinate.constructor_.call(this, c.x, c.y, c.getZ());
		} else if (arguments.length === 2) {
			const x = arguments[0], y = arguments[1];
			Coordinate.constructor_.call(this, x, y, Coordinate.NULL_ORDINATE);
		} else if (arguments.length === 3) {
			const x = arguments[0], y = arguments[1], z = arguments[2];
			this.x = x;
			this.y = y;
			this.z = z;
		}
	}
	static hashCode(n) {
		kBufAsF64[0] = n;
		return kBufAsI32[0] ^ kBufAsI32[1];
	}
	equals2D() {
		if (arguments.length === 1) {
			const other = arguments[0];
			if (this.x !== other.x) return false;
			if (this.y !== other.y) return false;
			return true;
		} else if (arguments.length === 2) {
			const c = arguments[0], tolerance = arguments[1];
			if (!NumberUtil.equalsWithTolerance(this.x, c.x, tolerance)) return false;
			if (!NumberUtil.equalsWithTolerance(this.y, c.y, tolerance)) return false;
			return true;
		}
	}
	setM(m) {
		throw new IllegalArgumentException("Invalid ordinate index: " + Coordinate.M);
	}
	equals3D(other) {
		return this.x === other.x && this.y === other.y && (this.getZ() === other.getZ() || Double.isNaN(this.getZ()) && Double.isNaN(other.getZ()));
	}
	setX(x) {
		this.x = x;
	}
	compareTo(o) {
		const other = o;
		if (this.x < other.x) return -1;
		if (this.x > other.x) return 1;
		if (this.y < other.y) return -1;
		if (this.y > other.y) return 1;
		return 0;
	}
	getX() {
		return this.x;
	}
	copy() {
		return new Coordinate(this);
	}
	toString() {
		return "(" + this.x + ", " + this.y + ", " + this.getZ() + ")";
	}
	distance3D(c) {
		const dx = this.x - c.x;
		const dy = this.y - c.y;
		const dz = this.getZ() - c.getZ();
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}
	getY() {
		return this.y;
	}
	getM() {
		return Double.NaN;
	}
	setOrdinate(ordinateIndex, value) {
		switch (ordinateIndex) {
			case Coordinate.X:
				this.x = value;
				break;
			case Coordinate.Y:
				this.y = value;
				break;
			case Coordinate.Z:
				this.setZ(value);
				break;
			default: throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
		}
	}
	getZ() {
		return this.z;
	}
	getOrdinate(ordinateIndex) {
		switch (ordinateIndex) {
			case Coordinate.X: return this.x;
			case Coordinate.Y: return this.y;
			case Coordinate.Z: return this.getZ();
		}
		throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
	}
	equals(other) {
		if (!(other instanceof Coordinate)) return false;
		return this.equals2D(other);
	}
	equalInZ(c, tolerance) {
		return NumberUtil.equalsWithTolerance(this.getZ(), c.getZ(), tolerance);
	}
	setZ(z) {
		this.z = z;
	}
	clone() {
		try {
			return null;
		} catch (e) {
			if (e instanceof CloneNotSupportedException) {
				Assert.shouldNeverReachHere("this shouldn't happen because this class is Cloneable");
				return null;
			} else throw e;
		}
	}
	setY(y) {
		this.y = y;
	}
	distance(c) {
		const dx = this.x - c.x;
		const dy = this.y - c.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
	hashCode() {
		let result = 17;
		result = 37 * result + Coordinate.hashCode(this.x);
		result = 37 * result + Coordinate.hashCode(this.y);
		return result;
	}
	setCoordinate(other) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.getZ();
	}
	get interfaces_() {
		return [
			Comparable,
			Clonable,
			Serializable
		];
	}
};
Coordinate.DimensionalComparator = class DimensionalComparator {
	constructor() {
		DimensionalComparator.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._dimensionsToTest = 2;
		if (arguments.length === 0) DimensionalComparator.constructor_.call(this, 2);
		else if (arguments.length === 1) {
			const dimensionsToTest = arguments[0];
			if (dimensionsToTest !== 2 && dimensionsToTest !== 3) throw new IllegalArgumentException("only 2 or 3 dimensions may be specified");
			this._dimensionsToTest = dimensionsToTest;
		}
	}
	static compare(a, b) {
		if (a < b) return -1;
		if (a > b) return 1;
		if (Double.isNaN(a)) {
			if (Double.isNaN(b)) return 0;
			return -1;
		}
		if (Double.isNaN(b)) return 1;
		return 0;
	}
	compare(c1, c2) {
		const compX = DimensionalComparator.compare(c1.x, c2.x);
		if (compX !== 0) return compX;
		const compY = DimensionalComparator.compare(c1.y, c2.y);
		if (compY !== 0) return compY;
		if (this._dimensionsToTest <= 2) return 0;
		return DimensionalComparator.compare(c1.getZ(), c2.getZ());
	}
	get interfaces_() {
		return [Comparator];
	}
};
Coordinate.NULL_ORDINATE = Double.NaN;
Coordinate.X = 0;
Coordinate.Y = 1;
Coordinate.Z = 2;
Coordinate.M = 3;
// node_modules/jsts/org/locationtech/jts/algorithm/Length.js
var Length = class {
	static ofLine(pts) {
		const n = pts.size();
		if (n <= 1) return 0;
		let len = 0;
		const p = new Coordinate();
		pts.getCoordinate(0, p);
		let x0 = p.x;
		let y0 = p.y;
		for (let i = 1; i < n; i++) {
			pts.getCoordinate(i, p);
			const x1 = p.x;
			const y1 = p.y;
			const dx = x1 - x0;
			const dy = y1 - y0;
			len += Math.sqrt(dx * dx + dy * dy);
			x0 = x1;
			y0 = y1;
		}
		return len;
	}
};
// node_modules/jsts/org/locationtech/jts/geom/GeometryComponentFilter.js
var GeometryComponentFilter = class {
	filter(geom) {}
};
// node_modules/jsts/java/lang/UnsupportedOperationException.js
var UnsupportedOperationException = class UnsupportedOperationException extends Exception {
	constructor(message) {
		super(message);
		this.name = Object.keys({ UnsupportedOperationException })[0];
	}
};
// node_modules/jsts/java/util/Collection.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/Collection.html
*/
var Collection = class {
	/**
	* Ensures that this collection contains the specified element (optional
	* operation).
	* @param {Object} e
	* @return {boolean}
	*/
	add() {}
	/**
	* Appends all of the elements in the specified collection to the end of this
	* list, in the order that they are returned by the specified collection's
	* iterator (optional operation).
	* @param {javascript.util.Collection} c
	* @return {boolean}
	*/
	addAll() {}
	/**
	* Returns true if this collection contains no elements.
	* @return {boolean}
	*/
	isEmpty() {}
	/**
	* Returns an iterator over the elements in this collection.
	* @return {javascript.util.Iterator}
	*/
	iterator() {}
	/**
	* Returns an iterator over the elements in this collection.
	* @return {number}
	*/
	size() {}
	/**
	* Returns an array containing all of the elements in this collection.
	* @return {Array}
	*/
	toArray() {}
	/**
	* Removes a single instance of the specified element from this collection if it
	* is present. (optional)
	* @param {Object} e
	* @return {boolean}
	*/
	remove() {}
};
// node_modules/jsts/java/lang/IndexOutOfBoundsException.js
var IndexOutOfBoundsException = class IndexOutOfBoundsException extends Exception {
	constructor(message) {
		super(message);
		this.name = Object.keys({ IndexOutOfBoundsException })[0];
	}
};
// node_modules/jsts/java/util/List.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/List.html
*/
var List = class extends Collection {
	/**
	* Returns the element at the specified position in this list.
	* @param {number} index
	* @return {Object}
	*/
	get() {}
	/**
	* Replaces the element at the specified position in this list with the
	* specified element (optional operation).
	* @param {number} index
	* @param {Object} e
	* @return {Object}
	*/
	set() {}
	/**
	* Returns true if this collection contains no elements.
	* @return {boolean}
	*/
	isEmpty() {}
};
// node_modules/jsts/java/util/NoSuchElementException.js
var NoSuchElementException = class NoSuchElementException extends Exception {
	constructor(message) {
		super(message);
		this.name = Object.keys({ NoSuchElementException })[0];
	}
};
// node_modules/jsts/java/util/ArrayList.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/ArrayList.html
*/
var ArrayList = class extends List {
	constructor(o) {
		super();
		this.array = [];
		if (o instanceof Collection) this.addAll(o);
	}
	get interfaces_() {
		return [List, Collection];
	}
	ensureCapacity() {}
	add(e) {
		if (arguments.length === 1) this.array.push(e);
		else this.array.splice(arguments[0], 0, arguments[1]);
		return true;
	}
	clear() {
		this.array = [];
	}
	addAll(c) {
		for (const e of c) this.array.push(e);
	}
	set(index, element) {
		const oldElement = this.array[index];
		this.array[index] = element;
		return oldElement;
	}
	iterator() {
		return new Iterator$3(this);
	}
	get(index) {
		if (index < 0 || index >= this.size()) throw new IndexOutOfBoundsException();
		return this.array[index];
	}
	isEmpty() {
		return this.array.length === 0;
	}
	sort(comparator) {
		if (comparator) this.array.sort((a, b) => comparator.compare(a, b));
		else this.array.sort();
	}
	size() {
		return this.array.length;
	}
	toArray() {
		return this.array.slice();
	}
	remove(o) {
		for (let i = 0, len = this.array.length; i < len; i++) if (this.array[i] === o) return !!this.array.splice(i, 1);
		return false;
	}
	[Symbol.iterator]() {
		return this.array.values();
	}
};
var Iterator$3 = class {
	constructor(arrayList) {
		this.arrayList = arrayList;
		this.position = 0;
	}
	next() {
		if (this.position === this.arrayList.size()) throw new NoSuchElementException();
		return this.arrayList.get(this.position++);
	}
	hasNext() {
		return this.position < this.arrayList.size();
	}
	set(element) {
		return this.arrayList.set(this.position - 1, element);
	}
	remove() {
		this.arrayList.remove(this.arrayList.get(this.position));
	}
};
// node_modules/jsts/org/locationtech/jts/geom/CoordinateList.js
var CoordinateList = class CoordinateList extends ArrayList {
	constructor() {
		super();
		CoordinateList.constructor_.apply(this, arguments);
	}
	static constructor_() {
		if (arguments.length === 0) {} else if (arguments.length === 1) {
			const coord = arguments[0];
			this.ensureCapacity(coord.length);
			this.add(coord, true);
		} else if (arguments.length === 2) {
			const coord = arguments[0], allowRepeated = arguments[1];
			this.ensureCapacity(coord.length);
			this.add(coord, allowRepeated);
		}
	}
	getCoordinate(i) {
		return this.get(i);
	}
	addAll() {
		if (arguments.length === 2 && typeof arguments[1] === "boolean" && hasInterface_default(arguments[0], Collection)) {
			const coll = arguments[0], allowRepeated = arguments[1];
			let isChanged = false;
			for (let i = coll.iterator(); i.hasNext();) {
				this.add(i.next(), allowRepeated);
				isChanged = true;
			}
			return isChanged;
		} else return super.addAll.apply(this, arguments);
	}
	clone() {
		const clone = super.clone.call(this);
		for (let i = 0; i < this.size(); i++) clone.add(i, this.get(i).clone());
		return clone;
	}
	closeRing() {
		if (this.size() > 0) {
			const duplicate = this.get(0).copy();
			this.add(duplicate, false);
		}
	}
	toCoordinateArray() {
		if (arguments.length === 0) return this.toArray(CoordinateList.coordArrayType);
		else if (arguments.length === 1) {
			if (arguments[0]) return this.toArray(CoordinateList.coordArrayType);
			const size = this.size();
			const pts = new Array(size).fill(null);
			for (let i = 0; i < size; i++) pts[i] = this.get(size - i - 1);
			return pts;
		}
	}
	add() {
		if (arguments.length === 1) {
			const coord = arguments[0];
			return super.add.call(this, coord);
		} else if (arguments.length === 2) {
			if (arguments[0] instanceof Array && typeof arguments[1] === "boolean") {
				const coord = arguments[0], allowRepeated = arguments[1];
				this.add(coord, allowRepeated, true);
				return true;
			} else if (arguments[0] instanceof Coordinate && typeof arguments[1] === "boolean") {
				const coord = arguments[0];
				if (!arguments[1]) {
					if (this.size() >= 1) {
						if (this.get(this.size() - 1).equals2D(coord)) return null;
					}
				}
				super.add.call(this, coord);
			} else if (arguments[0] instanceof Object && typeof arguments[1] === "boolean") {
				const obj = arguments[0], allowRepeated = arguments[1];
				this.add(obj, allowRepeated);
				return true;
			}
		} else if (arguments.length === 3) {
			if (typeof arguments[2] === "boolean" && arguments[0] instanceof Array && typeof arguments[1] === "boolean") {
				const coord = arguments[0], allowRepeated = arguments[1];
				if (arguments[2]) for (let i = 0; i < coord.length; i++) this.add(coord[i], allowRepeated);
				else for (let i = coord.length - 1; i >= 0; i--) this.add(coord[i], allowRepeated);
				return true;
			} else if (typeof arguments[2] === "boolean" && Number.isInteger(arguments[0]) && arguments[1] instanceof Coordinate) {
				const i = arguments[0], coord = arguments[1];
				if (!arguments[2]) {
					const size = this.size();
					if (size > 0) {
						if (i > 0) {
							if (this.get(i - 1).equals2D(coord)) return null;
						}
						if (i < size) {
							if (this.get(i).equals2D(coord)) return null;
						}
					}
				}
				super.add.call(this, i, coord);
			}
		} else if (arguments.length === 4) {
			const coord = arguments[0], allowRepeated = arguments[1], start = arguments[2], end = arguments[3];
			let inc = 1;
			if (start > end) inc = -1;
			for (let i = start; i !== end; i += inc) this.add(coord[i], allowRepeated);
			return true;
		}
	}
};
CoordinateList.coordArrayType = new Array(0).fill(null);
// node_modules/jsts/org/locationtech/jts/geom/CoordinateXY.js
var CoordinateXY = class CoordinateXY extends Coordinate {
	constructor() {
		super();
		CoordinateXY.constructor_.apply(this, arguments);
	}
	static constructor_() {
		if (arguments.length === 0) Coordinate.constructor_.call(this);
		else if (arguments.length === 1) {
			if (arguments[0] instanceof CoordinateXY) {
				const coord = arguments[0];
				Coordinate.constructor_.call(this, coord.x, coord.y);
			} else if (arguments[0] instanceof Coordinate) {
				const coord = arguments[0];
				Coordinate.constructor_.call(this, coord.x, coord.y);
			}
		} else if (arguments.length === 2) {
			const x = arguments[0], y = arguments[1];
			Coordinate.constructor_.call(this, x, y, Coordinate.NULL_ORDINATE);
		}
	}
	setOrdinate(ordinateIndex, value) {
		switch (ordinateIndex) {
			case CoordinateXY.X:
				this.x = value;
				break;
			case CoordinateXY.Y:
				this.y = value;
				break;
			default: throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
		}
	}
	setZ(z) {
		throw new IllegalArgumentException("CoordinateXY dimension 2 does not support z-ordinate");
	}
	copy() {
		return new CoordinateXY(this);
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
	setCoordinate(other) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.getZ();
	}
	getZ() {
		return Coordinate.NULL_ORDINATE;
	}
	getOrdinate(ordinateIndex) {
		switch (ordinateIndex) {
			case CoordinateXY.X: return this.x;
			case CoordinateXY.Y: return this.y;
		}
		throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
	}
};
CoordinateXY.X = 0;
CoordinateXY.Y = 1;
CoordinateXY.Z = -1;
CoordinateXY.M = -1;
// node_modules/jsts/org/locationtech/jts/geom/CoordinateXYM.js
var CoordinateXYM = class CoordinateXYM extends Coordinate {
	constructor() {
		super();
		CoordinateXYM.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._m = null;
		if (arguments.length === 0) {
			Coordinate.constructor_.call(this);
			this._m = 0;
		} else if (arguments.length === 1) {
			if (arguments[0] instanceof CoordinateXYM) {
				const coord = arguments[0];
				Coordinate.constructor_.call(this, coord.x, coord.y);
				this._m = coord._m;
			} else if (arguments[0] instanceof Coordinate) {
				const coord = arguments[0];
				Coordinate.constructor_.call(this, coord.x, coord.y);
				this._m = this.getM();
			}
		} else if (arguments.length === 3) {
			const x = arguments[0], y = arguments[1], m = arguments[2];
			Coordinate.constructor_.call(this, x, y, Coordinate.NULL_ORDINATE);
			this._m = m;
		}
	}
	setM(m) {
		this._m = m;
	}
	setZ(z) {
		throw new IllegalArgumentException("CoordinateXY dimension 2 does not support z-ordinate");
	}
	copy() {
		return new CoordinateXYM(this);
	}
	toString() {
		return "(" + this.x + ", " + this.y + " m=" + this.getM() + ")";
	}
	setCoordinate(other) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.getZ();
		this._m = other.getM();
	}
	getM() {
		return this._m;
	}
	setOrdinate(ordinateIndex, value) {
		switch (ordinateIndex) {
			case CoordinateXYM.X:
				this.x = value;
				break;
			case CoordinateXYM.Y:
				this.y = value;
				break;
			case CoordinateXYM.M:
				this._m = value;
				break;
			default: throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
		}
	}
	getZ() {
		return Coordinate.NULL_ORDINATE;
	}
	getOrdinate(ordinateIndex) {
		switch (ordinateIndex) {
			case CoordinateXYM.X: return this.x;
			case CoordinateXYM.Y: return this.y;
			case CoordinateXYM.M: return this._m;
		}
		throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
	}
};
CoordinateXYM.X = 0;
CoordinateXYM.Y = 1;
CoordinateXYM.Z = -1;
CoordinateXYM.M = 2;
// node_modules/jsts/org/locationtech/jts/geom/CoordinateXYZM.js
var CoordinateXYZM = class CoordinateXYZM extends Coordinate {
	constructor() {
		super();
		CoordinateXYZM.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._m = null;
		if (arguments.length === 0) {
			Coordinate.constructor_.call(this);
			this._m = 0;
		} else if (arguments.length === 1) {
			if (arguments[0] instanceof CoordinateXYZM) {
				const coord = arguments[0];
				Coordinate.constructor_.call(this, coord);
				this._m = coord._m;
			} else if (arguments[0] instanceof Coordinate) {
				const coord = arguments[0];
				Coordinate.constructor_.call(this, coord);
				this._m = this.getM();
			}
		} else if (arguments.length === 4) {
			const x = arguments[0], y = arguments[1], z = arguments[2], m = arguments[3];
			Coordinate.constructor_.call(this, x, y, z);
			this._m = m;
		}
	}
	setM(m) {
		this._m = m;
	}
	getOrdinate(ordinateIndex) {
		switch (ordinateIndex) {
			case Coordinate.X: return this.x;
			case Coordinate.Y: return this.y;
			case Coordinate.Z: return this.getZ();
			case Coordinate.M: return this.getM();
		}
		throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
	}
	copy() {
		return new CoordinateXYZM(this);
	}
	toString() {
		return "(" + this.x + ", " + this.y + ", " + this.getZ() + " m=" + this.getM() + ")";
	}
	setCoordinate(other) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.getZ();
		this._m = other.getM();
	}
	getM() {
		return this._m;
	}
	setOrdinate(ordinateIndex, value) {
		switch (ordinateIndex) {
			case Coordinate.X:
				this.x = value;
				break;
			case Coordinate.Y:
				this.y = value;
				break;
			case Coordinate.Z:
				this.z = value;
				break;
			case Coordinate.M:
				this._m = value;
				break;
			default: throw new IllegalArgumentException("Invalid ordinate index: " + ordinateIndex);
		}
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Coordinates.js
var Coordinates = class Coordinates {
	static measures(coordinate) {
		if (coordinate instanceof CoordinateXY) return 0;
		else if (coordinate instanceof CoordinateXYM) return 1;
		else if (coordinate instanceof CoordinateXYZM) return 1;
		else if (coordinate instanceof Coordinate) return 0;
		return 0;
	}
	static create() {
		if (arguments.length === 1) {
			const dimension = arguments[0];
			return Coordinates.create(dimension, 0);
		} else if (arguments.length === 2) {
			const dimension = arguments[0], measures = arguments[1];
			if (dimension === 2) return new CoordinateXY();
			else if (dimension === 3 && measures === 0) return new Coordinate();
			else if (dimension === 3 && measures === 1) return new CoordinateXYM();
			else if (dimension === 4 && measures === 1) return new CoordinateXYZM();
			return new Coordinate();
		}
	}
	static dimension(coordinate) {
		if (coordinate instanceof CoordinateXY) return 2;
		else if (coordinate instanceof CoordinateXYM) return 3;
		else if (coordinate instanceof CoordinateXYZM) return 4;
		else if (coordinate instanceof Coordinate) return 3;
		return 3;
	}
};
// node_modules/jsts/org/locationtech/jts/math/MathUtil.js
var MathUtil = class MathUtil {
	static log10(x) {
		const ln = Math.log(x);
		if (Double.isInfinite(ln)) return ln;
		if (Double.isNaN(ln)) return ln;
		return ln / MathUtil.LOG_10;
	}
	static min(v1, v2, v3, v4) {
		let min = v1;
		if (v2 < min) min = v2;
		if (v3 < min) min = v3;
		if (v4 < min) min = v4;
		return min;
	}
	static clamp() {
		if (typeof arguments[2] === "number" && typeof arguments[0] === "number" && typeof arguments[1] === "number") {
			const x = arguments[0], min = arguments[1], max = arguments[2];
			if (x < min) return min;
			if (x > max) return max;
			return x;
		} else if (Number.isInteger(arguments[2]) && Number.isInteger(arguments[0]) && Number.isInteger(arguments[1])) {
			const x = arguments[0], min = arguments[1], max = arguments[2];
			if (x < min) return min;
			if (x > max) return max;
			return x;
		}
	}
	static average(x1, x2) {
		return (x1 + x2) / 2;
	}
	static wrap(index, max) {
		if (index < 0) return max - -index % max;
		return index % max;
	}
	static max() {
		if (arguments.length === 3) {
			const v1 = arguments[0], v2 = arguments[1], v3 = arguments[2];
			let max = v1;
			if (v2 > max) max = v2;
			if (v3 > max) max = v3;
			return max;
		} else if (arguments.length === 4) {
			const v1 = arguments[0], v2 = arguments[1], v3 = arguments[2], v4 = arguments[3];
			let max = v1;
			if (v2 > max) max = v2;
			if (v3 > max) max = v3;
			if (v4 > max) max = v4;
			return max;
		}
	}
};
MathUtil.LOG_10 = Math.log(10);
// node_modules/jsts/java/lang/System.js
var System = class {
	static arraycopy(src, srcPos, dest, destPos, len) {
		let c = 0;
		for (let i = srcPos; i < srcPos + len; i++) {
			dest[destPos + c] = src[i];
			c++;
		}
	}
	static getProperty(name) {
		return { "line.separator": "\n" }[name];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Envelope.js
var Envelope = class Envelope {
	constructor() {
		Envelope.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._minx = null;
		this._maxx = null;
		this._miny = null;
		this._maxy = null;
		if (arguments.length === 0) this.init();
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Coordinate) {
				const p = arguments[0];
				this.init(p.x, p.x, p.y, p.y);
			} else if (arguments[0] instanceof Envelope) {
				const env = arguments[0];
				this.init(env);
			}
		} else if (arguments.length === 2) {
			const p1 = arguments[0], p2 = arguments[1];
			this.init(p1.x, p2.x, p1.y, p2.y);
		} else if (arguments.length === 4) {
			const x1 = arguments[0], x2 = arguments[1], y1 = arguments[2], y2 = arguments[3];
			this.init(x1, x2, y1, y2);
		}
	}
	static intersects() {
		if (arguments.length === 3) {
			const p1 = arguments[0], p2 = arguments[1], q = arguments[2];
			if (q.x >= (p1.x < p2.x ? p1.x : p2.x) && q.x <= (p1.x > p2.x ? p1.x : p2.x) && q.y >= (p1.y < p2.y ? p1.y : p2.y) && q.y <= (p1.y > p2.y ? p1.y : p2.y)) return true;
			return false;
		} else if (arguments.length === 4) {
			const p1 = arguments[0], p2 = arguments[1], q1 = arguments[2], q2 = arguments[3];
			let minq = Math.min(q1.x, q2.x);
			let maxq = Math.max(q1.x, q2.x);
			let minp = Math.min(p1.x, p2.x);
			let maxp = Math.max(p1.x, p2.x);
			if (minp > maxq) return false;
			if (maxp < minq) return false;
			minq = Math.min(q1.y, q2.y);
			maxq = Math.max(q1.y, q2.y);
			minp = Math.min(p1.y, p2.y);
			maxp = Math.max(p1.y, p2.y);
			if (minp > maxq) return false;
			if (maxp < minq) return false;
			return true;
		}
	}
	getArea() {
		return this.getWidth() * this.getHeight();
	}
	getMinX() {
		return this._minx;
	}
	expandToInclude() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof Coordinate) {
				const p = arguments[0];
				this.expandToInclude(p.x, p.y);
			} else if (arguments[0] instanceof Envelope) {
				const other = arguments[0];
				if (other.isNull()) return null;
				if (this.isNull()) {
					this._minx = other.getMinX();
					this._maxx = other.getMaxX();
					this._miny = other.getMinY();
					this._maxy = other.getMaxY();
				} else {
					if (other._minx < this._minx) this._minx = other._minx;
					if (other._maxx > this._maxx) this._maxx = other._maxx;
					if (other._miny < this._miny) this._miny = other._miny;
					if (other._maxy > this._maxy) this._maxy = other._maxy;
				}
			}
		} else if (arguments.length === 2) {
			const x = arguments[0], y = arguments[1];
			if (this.isNull()) {
				this._minx = x;
				this._maxx = x;
				this._miny = y;
				this._maxy = y;
			} else {
				if (x < this._minx) this._minx = x;
				if (x > this._maxx) this._maxx = x;
				if (y < this._miny) this._miny = y;
				if (y > this._maxy) this._maxy = y;
			}
		}
	}
	compareTo(o) {
		const env = o;
		if (this.isNull()) {
			if (env.isNull()) return 0;
			return -1;
		} else if (env.isNull()) return 1;
		if (this._minx < env._minx) return -1;
		if (this._minx > env._minx) return 1;
		if (this._miny < env._miny) return -1;
		if (this._miny > env._miny) return 1;
		if (this._maxx < env._maxx) return -1;
		if (this._maxx > env._maxx) return 1;
		if (this._maxy < env._maxy) return -1;
		if (this._maxy > env._maxy) return 1;
		return 0;
	}
	translate(transX, transY) {
		if (this.isNull()) return null;
		this.init(this.getMinX() + transX, this.getMaxX() + transX, this.getMinY() + transY, this.getMaxY() + transY);
	}
	copy() {
		return new Envelope(this);
	}
	expandBy() {
		if (arguments.length === 1) {
			const distance = arguments[0];
			this.expandBy(distance, distance);
		} else if (arguments.length === 2) {
			const deltaX = arguments[0], deltaY = arguments[1];
			if (this.isNull()) return null;
			this._minx -= deltaX;
			this._maxx += deltaX;
			this._miny -= deltaY;
			this._maxy += deltaY;
			if (this._minx > this._maxx || this._miny > this._maxy) this.setToNull();
		}
	}
	contains() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof Envelope) {
				const other = arguments[0];
				return this.covers(other);
			} else if (arguments[0] instanceof Coordinate) {
				const p = arguments[0];
				return this.covers(p);
			}
		} else if (arguments.length === 2) {
			const x = arguments[0], y = arguments[1];
			return this.covers(x, y);
		}
	}
	hashCode() {
		let result = 17;
		result = 37 * result + Coordinate.hashCode(this._minx);
		result = 37 * result + Coordinate.hashCode(this._maxx);
		result = 37 * result + Coordinate.hashCode(this._miny);
		result = 37 * result + Coordinate.hashCode(this._maxy);
		return result;
	}
	equals(other) {
		if (!(other instanceof Envelope)) return false;
		const otherEnvelope = other;
		if (this.isNull()) return otherEnvelope.isNull();
		return this._maxx === otherEnvelope.getMaxX() && this._maxy === otherEnvelope.getMaxY() && this._minx === otherEnvelope.getMinX() && this._miny === otherEnvelope.getMinY();
	}
	intersection(env) {
		if (this.isNull() || env.isNull() || !this.intersects(env)) return new Envelope();
		const intMinX = this._minx > env._minx ? this._minx : env._minx;
		const intMinY = this._miny > env._miny ? this._miny : env._miny;
		const intMaxX = this._maxx < env._maxx ? this._maxx : env._maxx;
		const intMaxY = this._maxy < env._maxy ? this._maxy : env._maxy;
		return new Envelope(intMinX, intMaxX, intMinY, intMaxY);
	}
	isNull() {
		return this._maxx < this._minx;
	}
	getMaxX() {
		return this._maxx;
	}
	covers() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof Coordinate) {
				const p = arguments[0];
				return this.covers(p.x, p.y);
			} else if (arguments[0] instanceof Envelope) {
				const other = arguments[0];
				if (this.isNull() || other.isNull()) return false;
				return other.getMinX() >= this._minx && other.getMaxX() <= this._maxx && other.getMinY() >= this._miny && other.getMaxY() <= this._maxy;
			}
		} else if (arguments.length === 2) {
			const x = arguments[0], y = arguments[1];
			if (this.isNull()) return false;
			return x >= this._minx && x <= this._maxx && y >= this._miny && y <= this._maxy;
		}
	}
	intersects() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof Envelope) {
				const other = arguments[0];
				if (this.isNull() || other.isNull()) return false;
				return !(other._minx > this._maxx || other._maxx < this._minx || other._miny > this._maxy || other._maxy < this._miny);
			} else if (arguments[0] instanceof Coordinate) {
				const p = arguments[0];
				return this.intersects(p.x, p.y);
			}
		} else if (arguments.length === 2) {
			if (arguments[0] instanceof Coordinate && arguments[1] instanceof Coordinate) {
				const a = arguments[0], b = arguments[1];
				if (this.isNull()) return false;
				if ((a.x < b.x ? a.x : b.x) > this._maxx) return false;
				if ((a.x > b.x ? a.x : b.x) < this._minx) return false;
				if ((a.y < b.y ? a.y : b.y) > this._maxy) return false;
				if ((a.y > b.y ? a.y : b.y) < this._miny) return false;
				return true;
			} else if (typeof arguments[0] === "number" && typeof arguments[1] === "number") {
				const x = arguments[0], y = arguments[1];
				if (this.isNull()) return false;
				return !(x > this._maxx || x < this._minx || y > this._maxy || y < this._miny);
			}
		}
	}
	getMinY() {
		return this._miny;
	}
	getDiameter() {
		if (this.isNull()) return 0;
		const w = this.getWidth();
		const h = this.getHeight();
		return Math.sqrt(w * w + h * h);
	}
	minExtent() {
		if (this.isNull()) return 0;
		const w = this.getWidth();
		const h = this.getHeight();
		if (w < h) return w;
		return h;
	}
	getWidth() {
		if (this.isNull()) return 0;
		return this._maxx - this._minx;
	}
	toString() {
		return "Env[" + this._minx + " : " + this._maxx + ", " + this._miny + " : " + this._maxy + "]";
	}
	setToNull() {
		this._minx = 0;
		this._maxx = -1;
		this._miny = 0;
		this._maxy = -1;
	}
	disjoint(other) {
		if (this.isNull() || other.isNull()) return true;
		return other._minx > this._maxx || other._maxx < this._minx || other._miny > this._maxy || other._maxy < this._miny;
	}
	getHeight() {
		if (this.isNull()) return 0;
		return this._maxy - this._miny;
	}
	maxExtent() {
		if (this.isNull()) return 0;
		const w = this.getWidth();
		const h = this.getHeight();
		if (w > h) return w;
		return h;
	}
	centre() {
		if (this.isNull()) return null;
		return new Coordinate((this.getMinX() + this.getMaxX()) / 2, (this.getMinY() + this.getMaxY()) / 2);
	}
	init() {
		if (arguments.length === 0) this.setToNull();
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Coordinate) {
				const p = arguments[0];
				this.init(p.x, p.x, p.y, p.y);
			} else if (arguments[0] instanceof Envelope) {
				const env = arguments[0];
				this._minx = env._minx;
				this._maxx = env._maxx;
				this._miny = env._miny;
				this._maxy = env._maxy;
			}
		} else if (arguments.length === 2) {
			const p1 = arguments[0], p2 = arguments[1];
			this.init(p1.x, p2.x, p1.y, p2.y);
		} else if (arguments.length === 4) {
			const x1 = arguments[0], x2 = arguments[1], y1 = arguments[2], y2 = arguments[3];
			if (x1 < x2) {
				this._minx = x1;
				this._maxx = x2;
			} else {
				this._minx = x2;
				this._maxx = x1;
			}
			if (y1 < y2) {
				this._miny = y1;
				this._maxy = y2;
			} else {
				this._miny = y2;
				this._maxy = y1;
			}
		}
	}
	getMaxY() {
		return this._maxy;
	}
	distance(env) {
		if (this.intersects(env)) return 0;
		let dx = 0;
		if (this._maxx < env._minx) dx = env._minx - this._maxx;
		else if (this._minx > env._maxx) dx = this._minx - env._maxx;
		let dy = 0;
		if (this._maxy < env._miny) dy = env._miny - this._maxy;
		else if (this._miny > env._maxy) dy = this._miny - env._maxy;
		if (dx === 0) return dy;
		if (dy === 0) return dx;
		return Math.sqrt(dx * dx + dy * dy);
	}
	get interfaces_() {
		return [Comparable, Serializable];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/CoordinateArrays.js
var CoordinateArrays = class CoordinateArrays {
	static scroll(coordinates, firstCoordinate) {
		const i = CoordinateArrays.indexOf(firstCoordinate, coordinates);
		if (i < 0) return null;
		const newCoordinates = new Array(coordinates.length).fill(null);
		System.arraycopy(coordinates, i, newCoordinates, 0, coordinates.length - i);
		System.arraycopy(coordinates, 0, newCoordinates, coordinates.length - i, i);
		System.arraycopy(newCoordinates, 0, coordinates, 0, coordinates.length);
	}
	static removeRepeatedPoints(coord) {
		if (!CoordinateArrays.hasRepeatedPoints(coord)) return coord;
		return new CoordinateList(coord, false).toCoordinateArray();
	}
	static reverse(coord) {
		const last = coord.length - 1;
		const mid = Math.trunc(last / 2);
		for (let i = 0; i <= mid; i++) {
			const tmp = coord[i];
			coord[i] = coord[last - i];
			coord[last - i] = tmp;
		}
	}
	static removeNull(coord) {
		let nonNull = 0;
		for (let i = 0; i < coord.length; i++) if (coord[i] !== null) nonNull++;
		const newCoord = new Array(nonNull).fill(null);
		if (nonNull === 0) return newCoord;
		let j = 0;
		for (let i = 0; i < coord.length; i++) if (coord[i] !== null) newCoord[j++] = coord[i];
		return newCoord;
	}
	static copyDeep() {
		if (arguments.length === 1) {
			const coordinates = arguments[0];
			const copy = new Array(coordinates.length).fill(null);
			for (let i = 0; i < coordinates.length; i++) copy[i] = coordinates[i].copy();
			return copy;
		} else if (arguments.length === 5) {
			const src = arguments[0], srcStart = arguments[1], dest = arguments[2], destStart = arguments[3], length = arguments[4];
			for (let i = 0; i < length; i++) dest[destStart + i] = src[srcStart + i].copy();
		}
	}
	static isEqualReversed(pts1, pts2) {
		for (let i = 0; i < pts1.length; i++) {
			const p1 = pts1[i];
			const p2 = pts2[pts1.length - i - 1];
			if (p1.compareTo(p2) !== 0) return false;
		}
		return true;
	}
	static envelope(coordinates) {
		const env = new Envelope();
		for (let i = 0; i < coordinates.length; i++) env.expandToInclude(coordinates[i]);
		return env;
	}
	static extract(pts, start, end) {
		start = MathUtil.clamp(start, 0, pts.length);
		end = MathUtil.clamp(end, -1, pts.length);
		let npts = end - start + 1;
		if (end < 0) npts = 0;
		if (start >= pts.length) npts = 0;
		if (end < start) npts = 0;
		const extractPts = new Array(npts).fill(null);
		if (npts === 0) return extractPts;
		let iPts = 0;
		for (let i = start; i <= end; i++) extractPts[iPts++] = pts[i];
		return extractPts;
	}
	static isRing(pts) {
		if (pts.length < 4) return false;
		if (!pts[0].equals2D(pts[pts.length - 1])) return false;
		return true;
	}
	static ptNotInList(testPts, pts) {
		for (let i = 0; i < testPts.length; i++) {
			const testPt = testPts[i];
			if (CoordinateArrays.indexOf(testPt, pts) < 0) return testPt;
		}
		return null;
	}
	static equals() {
		if (arguments.length === 2) {
			const coord1 = arguments[0], coord2 = arguments[1];
			if (coord1 === coord2) return true;
			if (coord1 === null || coord2 === null) return false;
			if (coord1.length !== coord2.length) return false;
			for (let i = 0; i < coord1.length; i++) if (!coord1[i].equals(coord2[i])) return false;
			return true;
		} else if (arguments.length === 3) {
			const coord1 = arguments[0], coord2 = arguments[1], coordinateComparator = arguments[2];
			if (coord1 === coord2) return true;
			if (coord1 === null || coord2 === null) return false;
			if (coord1.length !== coord2.length) return false;
			for (let i = 0; i < coord1.length; i++) if (coordinateComparator.compare(coord1[i], coord2[i]) !== 0) return false;
			return true;
		}
	}
	static intersection(coordinates, env) {
		const coordList = new CoordinateList();
		for (let i = 0; i < coordinates.length; i++) if (env.intersects(coordinates[i])) coordList.add(coordinates[i], true);
		return coordList.toCoordinateArray();
	}
	static measures(pts) {
		if (pts === null || pts.length === 0) return 0;
		let measures = 0;
		for (const coordinate of pts) measures = Math.max(measures, Coordinates.measures(coordinate));
		return measures;
	}
	static hasRepeatedPoints(coord) {
		for (let i = 1; i < coord.length; i++) if (coord[i - 1].equals(coord[i])) return true;
		return false;
	}
	static toCoordinateArray(coordList) {
		return coordList.toArray(CoordinateArrays.coordArrayType);
	}
	static dimension(pts) {
		if (pts === null || pts.length === 0) return 3;
		let dimension = 0;
		for (const coordinate of pts) dimension = Math.max(dimension, Coordinates.dimension(coordinate));
		return dimension;
	}
	static atLeastNCoordinatesOrNothing(n, c) {
		return c.length >= n ? c : [];
	}
	static indexOf(coordinate, coordinates) {
		for (let i = 0; i < coordinates.length; i++) if (coordinate.equals(coordinates[i])) return i;
		return -1;
	}
	static increasingDirection(pts) {
		for (let i = 0; i < Math.trunc(pts.length / 2); i++) {
			const j = pts.length - 1 - i;
			const comp = pts[i].compareTo(pts[j]);
			if (comp !== 0) return comp;
		}
		return 1;
	}
	static compare(pts1, pts2) {
		let i = 0;
		while (i < pts1.length && i < pts2.length) {
			const compare = pts1[i].compareTo(pts2[i]);
			if (compare !== 0) return compare;
			i++;
		}
		if (i < pts2.length) return -1;
		if (i < pts1.length) return 1;
		return 0;
	}
	static minCoordinate(coordinates) {
		let minCoord = null;
		for (let i = 0; i < coordinates.length; i++) if (minCoord === null || minCoord.compareTo(coordinates[i]) > 0) minCoord = coordinates[i];
		return minCoord;
	}
};
var ForwardComparator = class {
	compare(o1, o2) {
		const pts1 = o1;
		const pts2 = o2;
		return CoordinateArrays.compare(pts1, pts2);
	}
	get interfaces_() {
		return [Comparator];
	}
};
var BidirectionalComparator = class {
	compare(o1, o2) {
		const pts1 = o1;
		const pts2 = o2;
		if (pts1.length < pts2.length) return -1;
		if (pts1.length > pts2.length) return 1;
		if (pts1.length === 0) return 0;
		const forwardComp = CoordinateArrays.compare(pts1, pts2);
		if (CoordinateArrays.isEqualReversed(pts1, pts2)) return 0;
		return forwardComp;
	}
	OLDcompare(o1, o2) {
		const pts1 = o1;
		const pts2 = o2;
		if (pts1.length < pts2.length) return -1;
		if (pts1.length > pts2.length) return 1;
		if (pts1.length === 0) return 0;
		const dir1 = CoordinateArrays.increasingDirection(pts1);
		const dir2 = CoordinateArrays.increasingDirection(pts2);
		let i1 = dir1 > 0 ? 0 : pts1.length - 1;
		let i2 = dir2 > 0 ? 0 : pts1.length - 1;
		for (let i = 0; i < pts1.length; i++) {
			const comparePt = pts1[i1].compareTo(pts2[i2]);
			if (comparePt !== 0) return comparePt;
			i1 += dir1;
			i2 += dir2;
		}
		return 0;
	}
	get interfaces_() {
		return [Comparator];
	}
};
CoordinateArrays.ForwardComparator = ForwardComparator;
CoordinateArrays.BidirectionalComparator = BidirectionalComparator;
CoordinateArrays.coordArrayType = new Array(0).fill(null);
// node_modules/jsts/java/lang/Character.js
var Character = class {
	static isWhitespace(c) {
		return c <= 32 && c >= 0 || c === 127;
	}
	static toUpperCase(c) {
		return c.toUpperCase();
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Dimension.js
var Dimension = class Dimension {
	static toDimensionSymbol(dimensionValue) {
		switch (dimensionValue) {
			case Dimension.FALSE: return Dimension.SYM_FALSE;
			case Dimension.TRUE: return Dimension.SYM_TRUE;
			case Dimension.DONTCARE: return Dimension.SYM_DONTCARE;
			case Dimension.P: return Dimension.SYM_P;
			case Dimension.L: return Dimension.SYM_L;
			case Dimension.A: return Dimension.SYM_A;
		}
		throw new IllegalArgumentException("Unknown dimension value: " + dimensionValue);
	}
	static toDimensionValue(dimensionSymbol) {
		switch (Character.toUpperCase(dimensionSymbol)) {
			case Dimension.SYM_FALSE: return Dimension.FALSE;
			case Dimension.SYM_TRUE: return Dimension.TRUE;
			case Dimension.SYM_DONTCARE: return Dimension.DONTCARE;
			case Dimension.SYM_P: return Dimension.P;
			case Dimension.SYM_L: return Dimension.L;
			case Dimension.SYM_A: return Dimension.A;
		}
		throw new IllegalArgumentException("Unknown dimension symbol: " + dimensionSymbol);
	}
};
Dimension.P = 0;
Dimension.L = 1;
Dimension.A = 2;
Dimension.FALSE = -1;
Dimension.TRUE = -2;
Dimension.DONTCARE = -3;
Dimension.SYM_FALSE = "F";
Dimension.SYM_TRUE = "T";
Dimension.SYM_DONTCARE = "*";
Dimension.SYM_P = "0";
Dimension.SYM_L = "1";
Dimension.SYM_A = "2";
// node_modules/jsts/org/locationtech/jts/geom/Geometry.js
var Geometry = class Geometry {
	constructor() {
		Geometry.constructor_.apply(this, arguments);
	}
	isGeometryCollection() {
		return this.getTypeCode() === Geometry.TYPECODE_GEOMETRYCOLLECTION;
	}
	getFactory() {
		return this._factory;
	}
	getGeometryN(n) {
		return this;
	}
	getArea() {
		return 0;
	}
	isRectangle() {
		return false;
	}
	equalsExact(other) {
		return this === other || this.equalsExact(other, 0);
	}
	geometryChanged() {
		this.apply(Geometry.geometryChangedFilter);
	}
	geometryChangedAction() {
		this._envelope = null;
	}
	equalsNorm(g) {
		if (g === null) return false;
		return this.norm().equalsExact(g.norm());
	}
	getLength() {
		return 0;
	}
	getNumGeometries() {
		return 1;
	}
	compareTo() {
		let other;
		if (arguments.length === 1) {
			const o = arguments[0];
			other = o;
			if (this.getTypeCode() !== other.getTypeCode()) return this.getTypeCode() - other.getTypeCode();
			if (this.isEmpty() && other.isEmpty()) return 0;
			if (this.isEmpty()) return -1;
			if (other.isEmpty()) return 1;
			return this.compareToSameClass(o);
		} else if (arguments.length === 2) {
			const o = arguments[0];
			const comp = arguments[1];
			other = o;
			if (this.getTypeCode() !== other.getTypeCode()) return this.getTypeCode() - other.getTypeCode();
			if (this.isEmpty() && other.isEmpty()) return 0;
			if (this.isEmpty()) return -1;
			if (other.isEmpty()) return 1;
			return this.compareToSameClass(o, comp);
		}
	}
	getUserData() {
		return this._userData;
	}
	getSRID() {
		return this._SRID;
	}
	getEnvelope() {
		return this.getFactory().toGeometry(this.getEnvelopeInternal());
	}
	static checkNotGeometryCollection(g) {
		if (g.getTypeCode() === Geometry.TYPECODE_GEOMETRYCOLLECTION) throw new IllegalArgumentException("This method does not support GeometryCollection arguments");
	}
	equal(a, b, tolerance) {
		if (tolerance === 0) return a.equals(b);
		return a.distance(b) <= tolerance;
	}
	norm() {
		const copy = this.copy();
		copy.normalize();
		return copy;
	}
	reverse() {
		const res = this.reverseInternal();
		if (this.envelope != null) res.envelope = this.envelope.copy();
		res.setSRID(this.getSRID());
		return res;
	}
	copy() {
		const copy = this.copyInternal();
		copy.envelope = this._envelope == null ? null : this._envelope.copy();
		copy._SRID = this._SRID;
		copy._userData = this._userData;
		return copy;
	}
	getPrecisionModel() {
		return this._factory.getPrecisionModel();
	}
	getEnvelopeInternal() {
		if (this._envelope === null) this._envelope = this.computeEnvelopeInternal();
		return new Envelope(this._envelope);
	}
	setSRID(SRID) {
		this._SRID = SRID;
	}
	setUserData(userData) {
		this._userData = userData;
	}
	compare(a, b) {
		const i = a.iterator();
		const j = b.iterator();
		while (i.hasNext() && j.hasNext()) {
			const aElement = i.next();
			const bElement = j.next();
			const comparison = aElement.compareTo(bElement);
			if (comparison !== 0) return comparison;
		}
		if (i.hasNext()) return 1;
		if (j.hasNext()) return -1;
		return 0;
	}
	hashCode() {
		return this.getEnvelopeInternal().hashCode();
	}
	isEquivalentClass(other) {
		return this.getTypeCode() == other.getTypeCode();
	}
	get interfaces_() {
		return [
			Clonable,
			Comparable,
			Serializable
		];
	}
	getClass() {
		return Geometry;
	}
	static hasNonEmptyElements(geometries) {
		for (let i = 0; i < geometries.length; i++) if (!geometries[i].isEmpty()) return true;
		return false;
	}
	static hasNullElements(array) {
		for (let i = 0; i < array.length; i++) if (array[i] === null) return true;
		return false;
	}
};
Geometry.constructor_ = function(factory) {
	if (!factory) return;
	this._envelope = null;
	this._userData = null;
	this._factory = factory;
	this._SRID = factory.getSRID();
};
Geometry.TYPECODE_POINT = 0;
Geometry.TYPECODE_MULTIPOINT = 1;
Geometry.TYPECODE_LINESTRING = 2;
Geometry.TYPECODE_LINEARRING = 3;
Geometry.TYPECODE_MULTILINESTRING = 4;
Geometry.TYPECODE_POLYGON = 5;
Geometry.TYPECODE_MULTIPOLYGON = 6;
Geometry.TYPECODE_GEOMETRYCOLLECTION = 7;
Geometry.TYPENAME_POINT = "Point";
Geometry.TYPENAME_MULTIPOINT = "MultiPoint";
Geometry.TYPENAME_LINESTRING = "LineString";
Geometry.TYPENAME_LINEARRING = "LinearRing";
Geometry.TYPENAME_MULTILINESTRING = "MultiLineString";
Geometry.TYPENAME_POLYGON = "Polygon";
Geometry.TYPENAME_MULTIPOLYGON = "MultiPolygon";
Geometry.TYPENAME_GEOMETRYCOLLECTION = "GeometryCollection";
Geometry.geometryChangedFilter = {
	get interfaces_() {
		return [GeometryComponentFilter];
	},
	filter(geom) {
		geom.geometryChangedAction();
	}
};
// node_modules/jsts/org/locationtech/jts/geom/CoordinateFilter.js
var CoordinateFilter = class {
	filter(coord) {}
};
// node_modules/jsts/org/locationtech/jts/geom/Lineal.js
var Lineal = class {};
// node_modules/jsts/org/locationtech/jts/geom/CoordinateSequence.js
var CoordinateSequence = class {
	getCoordinate() {
		if (arguments.length === 1) arguments[0];
		else if (arguments.length === 2) {
			arguments[0];
			arguments[1];
		}
	}
	getCoordinateCopy(i) {}
	createCoordinate() {}
	getDimension() {}
	hasM() {
		return this.getMeasures() > 0;
	}
	getX(index) {}
	hasZ() {
		return this.getDimension() - this.getMeasures() > 2;
	}
	getMeasures() {
		return 0;
	}
	expandEnvelope(env) {}
	copy() {}
	getY(index) {}
	toCoordinateArray() {}
	getM(index) {
		if (this.hasM()) {
			const mIndex = this.getDimension() - this.getMeasures();
			return this.getOrdinate(index, mIndex);
		} else return Double.NaN;
	}
	setOrdinate(index, ordinateIndex, value) {}
	getZ(index) {
		if (this.hasZ()) return this.getOrdinate(index, 2);
		else return Double.NaN;
	}
	size() {}
	getOrdinate(index, ordinateIndex) {}
	get interfaces_() {
		return [Clonable];
	}
};
CoordinateSequence.X = 0;
CoordinateSequence.Y = 1;
CoordinateSequence.Z = 2;
CoordinateSequence.M = 3;
// node_modules/jsts/org/locationtech/jts/geom/CoordinateSequences.js
var CoordinateSequences = class CoordinateSequences {
	static scroll() {
		if (arguments.length === 2) {
			if (hasInterface_default(arguments[0], CoordinateSequence) && Number.isInteger(arguments[1])) {
				const seq = arguments[0], indexOfFirstCoordinate = arguments[1];
				CoordinateSequences.scroll(seq, indexOfFirstCoordinate, CoordinateSequences.isRing(seq));
			} else if (hasInterface_default(arguments[0], CoordinateSequence) && arguments[1] instanceof Coordinate) {
				const seq = arguments[0], firstCoordinate = arguments[1];
				const i = CoordinateSequences.indexOf(firstCoordinate, seq);
				if (i <= 0) return null;
				CoordinateSequences.scroll(seq, i);
			}
		} else if (arguments.length === 3) {
			const seq = arguments[0], indexOfFirstCoordinate = arguments[1], ensureRing = arguments[2];
			if (indexOfFirstCoordinate <= 0) return null;
			const copy = seq.copy();
			const last = ensureRing ? seq.size() - 1 : seq.size();
			for (let j = 0; j < last; j++) for (let k = 0; k < seq.getDimension(); k++) seq.setOrdinate(j, k, copy.getOrdinate((indexOfFirstCoordinate + j) % last, k));
			if (ensureRing) for (let k = 0; k < seq.getDimension(); k++) seq.setOrdinate(last, k, seq.getOrdinate(0, k));
		}
	}
	static isEqual(cs1, cs2) {
		const cs1Size = cs1.size();
		if (cs1Size !== cs2.size()) return false;
		const dim = Math.min(cs1.getDimension(), cs2.getDimension());
		for (let i = 0; i < cs1Size; i++) for (let d = 0; d < dim; d++) {
			const v1 = cs1.getOrdinate(i, d);
			const v2 = cs2.getOrdinate(i, d);
			if (cs1.getOrdinate(i, d) === cs2.getOrdinate(i, d)) continue;
			if (Double.isNaN(v1) && Double.isNaN(v2)) continue;
			return false;
		}
		return true;
	}
	static minCoordinateIndex() {
		if (arguments.length === 1) {
			const seq = arguments[0];
			return CoordinateSequences.minCoordinateIndex(seq, 0, seq.size() - 1);
		} else if (arguments.length === 3) {
			const seq = arguments[0], from = arguments[1], to = arguments[2];
			let minCoordIndex = -1;
			let minCoord = null;
			for (let i = from; i <= to; i++) {
				const testCoord = seq.getCoordinate(i);
				if (minCoord === null || minCoord.compareTo(testCoord) > 0) {
					minCoord = testCoord;
					minCoordIndex = i;
				}
			}
			return minCoordIndex;
		}
	}
	static extend(fact, seq, size) {
		const newseq = fact.create(size, seq.getDimension());
		const n = seq.size();
		CoordinateSequences.copy(seq, 0, newseq, 0, n);
		if (n > 0) for (let i = n; i < size; i++) CoordinateSequences.copy(seq, n - 1, newseq, i, 1);
		return newseq;
	}
	static reverse(seq) {
		const last = seq.size() - 1;
		const mid = Math.trunc(last / 2);
		for (let i = 0; i <= mid; i++) CoordinateSequences.swap(seq, i, last - i);
	}
	static ensureValidRing(fact, seq) {
		const n = seq.size();
		if (n === 0) return seq;
		if (n <= 3) return CoordinateSequences.createClosedRing(fact, seq, 4);
		if (seq.getOrdinate(0, CoordinateSequence.X) === seq.getOrdinate(n - 1, CoordinateSequence.X) && seq.getOrdinate(0, CoordinateSequence.Y) === seq.getOrdinate(n - 1, CoordinateSequence.Y)) return seq;
		return CoordinateSequences.createClosedRing(fact, seq, n + 1);
	}
	static minCoordinate(seq) {
		let minCoord = null;
		for (let i = 0; i < seq.size(); i++) {
			const testCoord = seq.getCoordinate(i);
			if (minCoord === null || minCoord.compareTo(testCoord) > 0) minCoord = testCoord;
		}
		return minCoord;
	}
	static copyCoord(src, srcPos, dest, destPos) {
		const minDim = Math.min(src.getDimension(), dest.getDimension());
		for (let dim = 0; dim < minDim; dim++) dest.setOrdinate(destPos, dim, src.getOrdinate(srcPos, dim));
	}
	static isRing(seq) {
		const n = seq.size();
		if (n === 0) return true;
		if (n <= 3) return false;
		return seq.getOrdinate(0, CoordinateSequence.X) === seq.getOrdinate(n - 1, CoordinateSequence.X) && seq.getOrdinate(0, CoordinateSequence.Y) === seq.getOrdinate(n - 1, CoordinateSequence.Y);
	}
	static swap(seq, i, j) {
		if (i === j) return null;
		for (let dim = 0; dim < seq.getDimension(); dim++) {
			const tmp = seq.getOrdinate(i, dim);
			seq.setOrdinate(i, dim, seq.getOrdinate(j, dim));
			seq.setOrdinate(j, dim, tmp);
		}
	}
	static copy(src, srcPos, dest, destPos, length) {
		for (let i = 0; i < length; i++) CoordinateSequences.copyCoord(src, srcPos + i, dest, destPos + i);
	}
	static indexOf(coordinate, seq) {
		for (let i = 0; i < seq.size(); i++) if (coordinate.x === seq.getOrdinate(i, CoordinateSequence.X) && coordinate.y === seq.getOrdinate(i, CoordinateSequence.Y)) return i;
		return -1;
	}
	static createClosedRing(fact, seq, size) {
		const newseq = fact.create(size, seq.getDimension());
		const n = seq.size();
		CoordinateSequences.copy(seq, 0, newseq, 0, n);
		for (let i = n; i < size; i++) CoordinateSequences.copy(seq, 0, newseq, i, 1);
		return newseq;
	}
};
// node_modules/jsts/org/locationtech/jts/geom/GeometryFilter.js
var GeometryFilter = class {
	filter(geom) {}
};
// node_modules/jsts/org/locationtech/jts/geom/CoordinateSequenceFilter.js
var CoordinateSequenceFilter = class {
	filter(seq, i) {}
	isGeometryChanged() {}
	isDone() {}
};
// node_modules/jsts/org/locationtech/jts/geom/LineString.js
var LineString = class LineString extends Geometry {
	constructor() {
		super();
		LineString.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._points = null;
		if (arguments.length === 0) {} else if (arguments.length === 2) {
			const points = arguments[0], factory = arguments[1];
			Geometry.constructor_.call(this, factory);
			this.init(points);
		}
	}
	computeEnvelopeInternal() {
		if (this.isEmpty()) return new Envelope();
		return this._points.expandEnvelope(new Envelope());
	}
	isRing() {
		return this.isClosed() && CoordinateArrays.isRing(this.getCoordinates());
	}
	getCoordinates() {
		return this._points.toCoordinateArray();
	}
	copyInternal() {
		return new LineString(this._points.copy(), this._factory);
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			const otherLineString = other;
			if (this._points.size() !== otherLineString._points.size()) return false;
			for (let i = 0; i < this._points.size(); i++) if (!this.equal(this._points.getCoordinate(i), otherLineString._points.getCoordinate(i), tolerance)) return false;
			return true;
		} else return super.equalsExact.apply(this, arguments);
	}
	isClosed() {
		if (this.isEmpty()) return false;
		return this.getCoordinateN(0).equals2D(this.getCoordinateN(this.getNumPoints() - 1));
	}
	reverseInternal() {
		const seq = this._points.copy();
		CoordinateSequences.reverse(seq);
		return this.getFactory().createLineString(seq);
	}
	getEndPoint() {
		if (this.isEmpty()) return null;
		return this.getPointN(this.getNumPoints() - 1);
	}
	getTypeCode() {
		return Geometry.TYPECODE_LINESTRING;
	}
	getDimension() {
		return 1;
	}
	getBoundary() {
		throw new UnsupportedOperationException();
	}
	isEquivalentClass(other) {
		return other instanceof LineString;
	}
	getCoordinateSequence() {
		return this._points;
	}
	getPointN(n) {
		return this.getFactory().createPoint(this._points.getCoordinate(n));
	}
	normalize() {
		for (let i = 0; i < Math.trunc(this._points.size() / 2); i++) {
			const j = this._points.size() - 1 - i;
			if (!this._points.getCoordinate(i).equals(this._points.getCoordinate(j))) {
				if (this._points.getCoordinate(i).compareTo(this._points.getCoordinate(j)) > 0) {
					const copy = this._points.copy();
					CoordinateSequences.reverse(copy);
					this._points = copy;
				}
				return null;
			}
		}
	}
	getCoordinate() {
		if (this.isEmpty()) return null;
		return this._points.getCoordinate(0);
	}
	getBoundaryDimension() {
		if (this.isClosed()) return Dimension.FALSE;
		return 0;
	}
	getLength() {
		return Length.ofLine(this._points);
	}
	getNumPoints() {
		return this._points.size();
	}
	compareToSameClass() {
		if (arguments.length === 1) {
			const line = arguments[0];
			let i = 0;
			let j = 0;
			while (i < this._points.size() && j < line._points.size()) {
				const comparison = this._points.getCoordinate(i).compareTo(line._points.getCoordinate(j));
				if (comparison !== 0) return comparison;
				i++;
				j++;
			}
			if (i < this._points.size()) return 1;
			if (j < line._points.size()) return -1;
			return 0;
		} else if (arguments.length === 2) {
			const o = arguments[0], comp = arguments[1];
			const line = o;
			return comp.compare(this._points, line._points);
		}
	}
	apply() {
		if (hasInterface_default(arguments[0], CoordinateFilter)) {
			const filter = arguments[0];
			for (let i = 0; i < this._points.size(); i++) filter.filter(this._points.getCoordinate(i));
		} else if (hasInterface_default(arguments[0], CoordinateSequenceFilter)) {
			const filter = arguments[0];
			if (this._points.size() === 0) return null;
			for (let i = 0; i < this._points.size(); i++) {
				filter.filter(this._points, i);
				if (filter.isDone()) break;
			}
			if (filter.isGeometryChanged()) this.geometryChanged();
		} else if (hasInterface_default(arguments[0], GeometryFilter)) arguments[0].filter(this);
		else if (hasInterface_default(arguments[0], GeometryComponentFilter)) arguments[0].filter(this);
	}
	getCoordinateN(n) {
		return this._points.getCoordinate(n);
	}
	getGeometryType() {
		return Geometry.TYPENAME_LINESTRING;
	}
	isEmpty() {
		return this._points.size() === 0;
	}
	init(points) {
		if (points === null) points = this.getFactory().getCoordinateSequenceFactory().create([]);
		if (points.size() === 1) throw new IllegalArgumentException("Invalid number of points in LineString (found " + points.size() + " - must be 0 or >= 2)");
		this._points = points;
	}
	isCoordinate(pt) {
		for (let i = 0; i < this._points.size(); i++) if (this._points.getCoordinate(i).equals(pt)) return true;
		return false;
	}
	getStartPoint() {
		if (this.isEmpty()) return null;
		return this.getPointN(0);
	}
	get interfaces_() {
		return [Lineal];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/LinearRing.js
var LinearRing = class LinearRing extends LineString {
	constructor() {
		super();
		LinearRing.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const points = arguments[0], factory = arguments[1];
		LineString.constructor_.call(this, points, factory);
		this.validateConstruction();
	}
	copyInternal() {
		return new LinearRing(this._points.copy(), this._factory);
	}
	getBoundaryDimension() {
		return Dimension.FALSE;
	}
	isClosed() {
		if (this.isEmpty()) return true;
		return super.isClosed.call(this);
	}
	reverseInternal() {
		const seq = this._points.copy();
		CoordinateSequences.reverse(seq);
		return this.getFactory().createLinearRing(seq);
	}
	getTypeCode() {
		return Geometry.TYPECODE_LINEARRING;
	}
	validateConstruction() {
		if (!this.isEmpty() && !super.isClosed.call(this)) throw new IllegalArgumentException("Points of LinearRing do not form a closed linestring");
		if (this.getCoordinateSequence().size() >= 1 && this.getCoordinateSequence().size() < LinearRing.MINIMUM_VALID_SIZE) throw new IllegalArgumentException("Invalid number of points in LinearRing (found " + this.getCoordinateSequence().size() + " - must be 0 or >= 4)");
	}
	getGeometryType() {
		return Geometry.TYPENAME_LINEARRING;
	}
};
LinearRing.MINIMUM_VALID_SIZE = 4;
// node_modules/jsts/org/locationtech/jts/geom/CoordinateSequenceFactory.js
var CoordinateSequenceFactory = class {
	create() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof Array) arguments[0];
			else if (hasInterface_default(arguments[0], CoordinateSequence)) arguments[0];
		} else if (arguments.length === 2) {
			arguments[0];
			arguments[1];
		} else if (arguments.length === 3) {
			const size = arguments[0], dimension = arguments[1];
			arguments[2];
			return this.create(size, dimension);
		}
	}
};
// node_modules/jsts/java/lang/StringBuilder.js
var StringBuilder = class {
	constructor(str) {
		this.str = str;
	}
	append(e) {
		this.str += e;
	}
	setCharAt(i, c) {
		this.str = this.str.substr(0, i) + c + this.str.substr(i + 1);
	}
	toString() {
		return this.str;
	}
};
// node_modules/jsts/org/locationtech/jts/geom/impl/CoordinateArraySequence.js
var CoordinateArraySequence = class CoordinateArraySequence {
	constructor() {
		CoordinateArraySequence.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._dimension = 3;
		this._measures = 0;
		this._coordinates = null;
		if (arguments.length === 1) {
			if (arguments[0] instanceof Array) {
				const coordinates = arguments[0];
				CoordinateArraySequence.constructor_.call(this, coordinates, CoordinateArrays.dimension(coordinates), CoordinateArrays.measures(coordinates));
			} else if (Number.isInteger(arguments[0])) {
				const size = arguments[0];
				this._coordinates = new Array(size).fill(null);
				for (let i = 0; i < size; i++) this._coordinates[i] = new Coordinate();
			} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const coordSeq = arguments[0];
				if (coordSeq === null) {
					this._coordinates = new Array(0).fill(null);
					return null;
				}
				this._dimension = coordSeq.getDimension();
				this._measures = coordSeq.getMeasures();
				this._coordinates = new Array(coordSeq.size()).fill(null);
				for (let i = 0; i < this._coordinates.length; i++) this._coordinates[i] = coordSeq.getCoordinateCopy(i);
			}
		} else if (arguments.length === 2) {
			if (arguments[0] instanceof Array && Number.isInteger(arguments[1])) {
				const coordinates = arguments[0], dimension = arguments[1];
				CoordinateArraySequence.constructor_.call(this, coordinates, dimension, CoordinateArrays.measures(coordinates));
			} else if (Number.isInteger(arguments[0]) && Number.isInteger(arguments[1])) {
				const size = arguments[0], dimension = arguments[1];
				this._coordinates = new Array(size).fill(null);
				this._dimension = dimension;
				for (let i = 0; i < size; i++) this._coordinates[i] = Coordinates.create(dimension);
			}
		} else if (arguments.length === 3) {
			if (Number.isInteger(arguments[2]) && arguments[0] instanceof Array && Number.isInteger(arguments[1])) {
				const coordinates = arguments[0], dimension = arguments[1], measures = arguments[2];
				this._dimension = dimension;
				this._measures = measures;
				if (coordinates === null) this._coordinates = new Array(0).fill(null);
				else this._coordinates = coordinates;
			} else if (Number.isInteger(arguments[2]) && Number.isInteger(arguments[0]) && Number.isInteger(arguments[1])) {
				const size = arguments[0], dimension = arguments[1], measures = arguments[2];
				this._coordinates = new Array(size).fill(null);
				this._dimension = dimension;
				this._measures = measures;
				for (let i = 0; i < size; i++) this._coordinates[i] = this.createCoordinate();
			}
		}
	}
	getCoordinate() {
		if (arguments.length === 1) {
			const i = arguments[0];
			return this._coordinates[i];
		} else if (arguments.length === 2) {
			const index = arguments[0];
			arguments[1].setCoordinate(this._coordinates[index]);
		}
	}
	getCoordinateCopy(i) {
		const copy = this.createCoordinate();
		copy.setCoordinate(this._coordinates[i]);
		return copy;
	}
	createCoordinate() {
		return Coordinates.create(this.getDimension(), this.getMeasures());
	}
	getDimension() {
		return this._dimension;
	}
	getX(index) {
		return this._coordinates[index].x;
	}
	getMeasures() {
		return this._measures;
	}
	expandEnvelope(env) {
		for (let i = 0; i < this._coordinates.length; i++) env.expandToInclude(this._coordinates[i]);
		return env;
	}
	copy() {
		const cloneCoordinates = new Array(this.size()).fill(null);
		for (let i = 0; i < this._coordinates.length; i++) {
			const duplicate = this.createCoordinate();
			duplicate.setCoordinate(this._coordinates[i]);
			cloneCoordinates[i] = duplicate;
		}
		return new CoordinateArraySequence(cloneCoordinates, this._dimension, this._measures);
	}
	toString() {
		if (this._coordinates.length > 0) {
			const strBuilder = new StringBuilder(17 * this._coordinates.length);
			strBuilder.append("(");
			strBuilder.append(this._coordinates[0]);
			for (let i = 1; i < this._coordinates.length; i++) {
				strBuilder.append(", ");
				strBuilder.append(this._coordinates[i]);
			}
			strBuilder.append(")");
			return strBuilder.toString();
		} else return "()";
	}
	getY(index) {
		return this._coordinates[index].y;
	}
	toCoordinateArray() {
		return this._coordinates;
	}
	getM(index) {
		if (this.hasM()) return this._coordinates[index].getM();
		else return Double.NaN;
	}
	setOrdinate(index, ordinateIndex, value) {
		switch (ordinateIndex) {
			case CoordinateSequence.X:
				this._coordinates[index].x = value;
				break;
			case CoordinateSequence.Y:
				this._coordinates[index].y = value;
				break;
			default: this._coordinates[index].setOrdinate(ordinateIndex, value);
		}
	}
	getZ(index) {
		if (this.hasZ()) return this._coordinates[index].getZ();
		else return Double.NaN;
	}
	size() {
		return this._coordinates.length;
	}
	getOrdinate(index, ordinateIndex) {
		switch (ordinateIndex) {
			case CoordinateSequence.X: return this._coordinates[index].x;
			case CoordinateSequence.Y: return this._coordinates[index].y;
			default: return this._coordinates[index].getOrdinate(ordinateIndex);
		}
	}
	get interfaces_() {
		return [CoordinateSequence, Serializable];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/impl/CoordinateArraySequenceFactory.js
var CoordinateArraySequenceFactory = class CoordinateArraySequenceFactory {
	static instance() {
		return CoordinateArraySequenceFactory.instanceObject;
	}
	readResolve() {
		return CoordinateArraySequenceFactory.instance();
	}
	create() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof Array) {
				const coordinates = arguments[0];
				return new CoordinateArraySequence(coordinates);
			} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const coordSeq = arguments[0];
				return new CoordinateArraySequence(coordSeq);
			}
		} else if (arguments.length === 2) {
			let size = arguments[0], dimension = arguments[1];
			if (dimension > 3) dimension = 3;
			if (dimension < 2) dimension = 2;
			return new CoordinateArraySequence(size, dimension);
		} else if (arguments.length === 3) {
			let size = arguments[0], dimension = arguments[1], measures = arguments[2];
			let spatial = dimension - measures;
			if (measures > 1) measures = 1;
			if (spatial > 3) spatial = 3;
			if (spatial < 2) spatial = 2;
			return new CoordinateArraySequence(size, spatial + measures, measures);
		}
	}
	get interfaces_() {
		return [CoordinateSequenceFactory, Serializable];
	}
};
CoordinateArraySequenceFactory.instanceObject = new CoordinateArraySequenceFactory();
// node_modules/jsts/java/util/Set.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/Set.html
*
* @extends {Collection}
* @constructor
* @private
*/
var Set = class extends Collection {
	/**
	* Returns true if this set contains the specified element. More formally,
	* returns true if and only if this set contains an element e such that (o==null ?
	* e==null : o.equals(e)).
	* @param {Object} e
	* @return {boolean}
	*/
	contains() {}
};
// node_modules/jsts/java/util/SortedSet.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/SortedSet.html
*/
var SortedSet = class extends Set {};
// node_modules/jsts/java/util/TreeSet.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/TreeSet.html
*/
var TreeSet = class extends SortedSet {
	constructor(o) {
		super();
		this.array = [];
		if (o instanceof Collection) this.addAll(o);
	}
	contains(o) {
		for (const e of this.array) if (e.compareTo(o) === 0) return true;
		return false;
	}
	add(o) {
		if (this.contains(o)) return false;
		for (let i = 0, len = this.array.length; i < len; i++) if (this.array[i].compareTo(o) === 1) return !!this.array.splice(i, 0, o);
		this.array.push(o);
		return true;
	}
	addAll(c) {
		for (const e of c) this.add(e);
		return true;
	}
	remove() {
		throw new UnsupportedOperationException();
	}
	size() {
		return this.array.length;
	}
	isEmpty() {
		return this.array.length === 0;
	}
	toArray() {
		return this.array.slice();
	}
	iterator() {
		return new Iterator$2(this.array);
	}
};
var Iterator$2 = class {
	constructor(array) {
		this.array = array;
		this.position = 0;
	}
	next() {
		if (this.position === this.array.length) throw new NoSuchElementException();
		return this.array[this.position++];
	}
	hasNext() {
		return this.position < this.array.length;
	}
	remove() {
		throw new UnsupportedOperationException();
	}
};
// node_modules/jsts/java/util/Arrays.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/Arrays.html
*/
var Arrays = class {
	static sort() {
		const a = arguments[0];
		if (arguments.length === 1) a.sort((a, b) => a.compareTo(b));
		else if (arguments.length === 2) a.sort((a, b) => arguments[1].compare(a, b));
		else if (arguments.length === 3) {
			const t = a.slice(arguments[1], arguments[2]);
			t.sort();
			const r = a.slice(0, arguments[1]).concat(t, a.slice(arguments[2], a.length));
			a.splice(0, a.length);
			for (const e of r) a.push(e);
		} else if (arguments.length === 4) {
			const t = a.slice(arguments[1], arguments[2]);
			t.sort((a, b) => arguments[3].compare(a, b));
			const r = a.slice(0, arguments[1]).concat(t, a.slice(arguments[2], a.length));
			a.splice(0, a.length);
			for (const e of r) a.push(e);
		}
	}
	/**
	* @param {Array} array
	* @return {ArrayList}
	*/
	static asList(array) {
		const arrayList = new ArrayList();
		for (const e of array) arrayList.add(e);
		return arrayList;
	}
	static copyOf(original, newLength) {
		return original.slice(0, newLength);
	}
};
// node_modules/jsts/org/locationtech/jts/geom/GeometryCollection.js
var GeometryCollection = class GeometryCollection extends Geometry {
	constructor() {
		super();
		GeometryCollection.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._geometries = null;
		if (arguments.length === 0) {} else if (arguments.length === 2) {
			let geometries = arguments[0], factory = arguments[1];
			Geometry.constructor_.call(this, factory);
			if (geometries === null) geometries = [];
			if (Geometry.hasNullElements(geometries)) throw new IllegalArgumentException("geometries must not contain null elements");
			this._geometries = geometries;
		}
	}
	computeEnvelopeInternal() {
		const envelope = new Envelope();
		for (let i = 0; i < this._geometries.length; i++) envelope.expandToInclude(this._geometries[i].getEnvelopeInternal());
		return envelope;
	}
	getGeometryN(n) {
		return this._geometries[n];
	}
	getCoordinates() {
		const coordinates = new Array(this.getNumPoints()).fill(null);
		let k = -1;
		for (let i = 0; i < this._geometries.length; i++) {
			const childCoordinates = this._geometries[i].getCoordinates();
			for (let j = 0; j < childCoordinates.length; j++) {
				k++;
				coordinates[k] = childCoordinates[j];
			}
		}
		return coordinates;
	}
	getArea() {
		let area = 0;
		for (let i = 0; i < this._geometries.length; i++) area += this._geometries[i].getArea();
		return area;
	}
	copyInternal() {
		const geometries = new Array(this._geometries.length).fill(null);
		for (let i = 0; i < geometries.length; i++) geometries[i] = this._geometries[i].copy();
		return new GeometryCollection(geometries, this._factory);
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			const otherCollection = other;
			if (this._geometries.length !== otherCollection._geometries.length) return false;
			for (let i = 0; i < this._geometries.length; i++) if (!this._geometries[i].equalsExact(otherCollection._geometries[i], tolerance)) return false;
			return true;
		} else return super.equalsExact.apply(this, arguments);
	}
	reverseInternal() {
		const numGeometries = this._geometries.length;
		const reversed = new ArrayList(numGeometries);
		for (let i = 0; i < numGeometries; i++) reversed.add(this._geometries[i].reverse());
		return this.getFactory().buildGeometry(reversed);
	}
	getTypeCode() {
		return Geometry.TYPECODE_GEOMETRYCOLLECTION;
	}
	getDimension() {
		let dimension = Dimension.FALSE;
		for (let i = 0; i < this._geometries.length; i++) dimension = Math.max(dimension, this._geometries[i].getDimension());
		return dimension;
	}
	getNumGeometries() {
		return this._geometries.length;
	}
	getBoundary() {
		Geometry.checkNotGeometryCollection(this);
		Assert.shouldNeverReachHere();
		return null;
	}
	getGeometryType() {
		return Geometry.TYPENAME_GEOMETRYCOLLECTION;
	}
	isEmpty() {
		for (let i = 0; i < this._geometries.length; i++) if (!this._geometries[i].isEmpty()) return false;
		return true;
	}
	normalize() {
		for (let i = 0; i < this._geometries.length; i++) this._geometries[i].normalize();
		Arrays.sort(this._geometries);
	}
	getCoordinate() {
		if (this.isEmpty()) return null;
		return this._geometries[0].getCoordinate();
	}
	getBoundaryDimension() {
		let dimension = Dimension.FALSE;
		for (let i = 0; i < this._geometries.length; i++) dimension = Math.max(dimension, this._geometries[i].getBoundaryDimension());
		return dimension;
	}
	getLength() {
		let sum = 0;
		for (let i = 0; i < this._geometries.length; i++) sum += this._geometries[i].getLength();
		return sum;
	}
	getNumPoints() {
		let numPoints = 0;
		for (let i = 0; i < this._geometries.length; i++) numPoints += this._geometries[i].getNumPoints();
		return numPoints;
	}
	compareToSameClass() {
		if (arguments.length === 1) {
			const o = arguments[0];
			const theseElements = new TreeSet(Arrays.asList(this._geometries));
			const otherElements = new TreeSet(Arrays.asList(o._geometries));
			return this.compare(theseElements, otherElements);
		} else if (arguments.length === 2) {
			const o = arguments[0], comp = arguments[1];
			const gc = o;
			const n1 = this.getNumGeometries();
			const n2 = gc.getNumGeometries();
			let i = 0;
			while (i < n1 && i < n2) {
				const thisGeom = this.getGeometryN(i);
				const otherGeom = gc.getGeometryN(i);
				const holeComp = thisGeom.compareToSameClass(otherGeom, comp);
				if (holeComp !== 0) return holeComp;
				i++;
			}
			if (i < n1) return 1;
			if (i < n2) return -1;
			return 0;
		}
	}
	apply() {
		if (hasInterface_default(arguments[0], CoordinateFilter)) {
			const filter = arguments[0];
			for (let i = 0; i < this._geometries.length; i++) this._geometries[i].apply(filter);
		} else if (hasInterface_default(arguments[0], CoordinateSequenceFilter)) {
			const filter = arguments[0];
			if (this._geometries.length === 0) return null;
			for (let i = 0; i < this._geometries.length; i++) {
				this._geometries[i].apply(filter);
				if (filter.isDone()) break;
			}
			if (filter.isGeometryChanged()) this.geometryChanged();
		} else if (hasInterface_default(arguments[0], GeometryFilter)) {
			const filter = arguments[0];
			filter.filter(this);
			for (let i = 0; i < this._geometries.length; i++) this._geometries[i].apply(filter);
		} else if (hasInterface_default(arguments[0], GeometryComponentFilter)) {
			const filter = arguments[0];
			filter.filter(this);
			for (let i = 0; i < this._geometries.length; i++) this._geometries[i].apply(filter);
		}
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Polygonal.js
var Polygonal = class {};
// node_modules/jsts/org/locationtech/jts/geom/MultiPolygon.js
var MultiPolygon = class MultiPolygon extends GeometryCollection {
	constructor() {
		super();
		MultiPolygon.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const polygons = arguments[0], factory = arguments[1];
		GeometryCollection.constructor_.call(this, polygons, factory);
	}
	copyInternal() {
		const polygons = new Array(this._geometries.length).fill(null);
		for (let i = 0; i < polygons.length; i++) polygons[i] = this._geometries[i].copy();
		return new MultiPolygon(polygons, this._factory);
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			return super.equalsExact.call(this, other, tolerance);
		} else return super.equalsExact.apply(this, arguments);
	}
	getBoundaryDimension() {
		return 1;
	}
	getTypeCode() {
		return Geometry.TYPECODE_MULTIPOLYGON;
	}
	getDimension() {
		return 2;
	}
	getBoundary() {
		if (this.isEmpty()) return this.getFactory().createMultiLineString();
		const allRings = new ArrayList();
		for (let i = 0; i < this._geometries.length; i++) {
			const rings = this._geometries[i].getBoundary();
			for (let j = 0; j < rings.getNumGeometries(); j++) allRings.add(rings.getGeometryN(j));
		}
		const allRingsArray = new Array(allRings.size()).fill(null);
		return this.getFactory().createMultiLineString(allRings.toArray(allRingsArray));
	}
	getGeometryType() {
		return Geometry.TYPENAME_MULTIPOLYGON;
	}
	get interfaces_() {
		return [Polygonal];
	}
};
// node_modules/jsts/java/util/Map.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/Map.html
*/
var Map$1 = class {
	/**
	* Returns the value to which the specified key is mapped, or null if this map
	* contains no mapping for the key.
	* @param {Object} key
	* @return {Object}
	*/
	get() {}
	/**
	* Associates the specified value with the specified key in this map (optional
	* operation).
	* @param {Object} key
	* @param {Object} value
	* @return {Object}
	*/
	put() {}
	/**
	* Returns the number of key-value mappings in this map.
	* @return {number}
	*/
	size() {}
	/**
	* Returns a Collection view of the values contained in this map.
	* @return {javascript.util.Collection}
	*/
	values() {}
	/**
	* Returns a {@link Set} view of the mappings contained in this map.
	* The set is backed by the map, so changes to the map are
	* reflected in the set, and vice-versa.  If the map is modified
	* while an iteration over the set is in progress (except through
	* the iterator's own <tt>remove</tt> operation, or through the
	* <tt>setValue</tt> operation on a map entry returned by the
	* iterator) the results of the iteration are undefined.  The set
	* supports element removal, which removes the corresponding
	* mapping from the map, via the <tt>Iterator.remove</tt>,
	* <tt>Set.remove</tt>, <tt>removeAll</tt>, <tt>retainAll</tt> and
	* <tt>clear</tt> operations.  It does not support the
	* <tt>add</tt> or <tt>addAll</tt> operations.
	*
	* @return {Set} a set view of the mappings contained in this map
	*/
	entrySet() {}
};
// node_modules/jsts/java/util/HashSet.js
/**
* @see http://docs.oracle.com/javase/6/docs/api/java/util/HashSet.html
*/
var HashSet = class extends Set {
	constructor(o) {
		super();
		this.map = /* @__PURE__ */ new Map();
		if (o instanceof Collection) this.addAll(o);
	}
	contains(o) {
		const hashCode = o.hashCode ? o.hashCode() : o;
		if (this.map.has(hashCode)) return true;
		return false;
	}
	add(o) {
		const hashCode = o.hashCode ? o.hashCode() : o;
		if (this.map.has(hashCode)) return false;
		return !!this.map.set(hashCode, o);
	}
	addAll(c) {
		for (const e of c) this.add(e);
		return true;
	}
	remove() {
		throw new UnsupportedOperationException();
	}
	size() {
		return this.map.size;
	}
	isEmpty() {
		return this.map.size === 0;
	}
	toArray() {
		return Array.from(this.map.values());
	}
	iterator() {
		return new Iterator$1(this.map);
	}
	[Symbol.iterator]() {
		return this.map;
	}
};
var Iterator$1 = class {
	constructor(map) {
		this.iterator = map.values();
		const { done, value } = this.iterator.next();
		this.done = done;
		this.value = value;
	}
	next() {
		if (this.done) throw new NoSuchElementException();
		const current = this.value;
		const { done, value } = this.iterator.next();
		this.done = done;
		this.value = value;
		return current;
	}
	hasNext() {
		return !this.done;
	}
	remove() {
		throw new UnsupportedOperationException();
	}
};
// node_modules/jsts/java/util/HashMap.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/HashMap.html
*/
var HashMap = class extends Map$1 {
	constructor() {
		super();
		this.map = /* @__PURE__ */ new Map();
	}
	get(key) {
		return this.map.get(key) || null;
	}
	put(key, value) {
		this.map.set(key, value);
		return value;
	}
	values() {
		const arrayList = new ArrayList();
		const it = this.map.values();
		let o = it.next();
		while (!o.done) {
			arrayList.add(o.value);
			o = it.next();
		}
		return arrayList;
	}
	entrySet() {
		const hashSet = new HashSet();
		this.map.entries().forEach((entry) => hashSet.add(entry));
		return hashSet;
	}
	size() {
		return this.map.size();
	}
};
// node_modules/jsts/java/lang/Integer.js
var Integer = class Integer {
	constructor(value) {
		this.value = value;
	}
	intValue() {
		return this.value;
	}
	compareTo(o) {
		if (this.value < o) return -1;
		if (this.value > o) return 1;
		return 0;
	}
	static compare(x, y) {
		if (x < y) return -1;
		if (x > y) return 1;
		return 0;
	}
	static isNan(n) {
		return Number.isNaN(n);
	}
	static valueOf(value) {
		return new Integer(value);
	}
};
// node_modules/jsts/org/locationtech/jts/geom/PrecisionModel.js
var PrecisionModel = class PrecisionModel {
	constructor() {
		PrecisionModel.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._modelType = null;
		this._scale = null;
		if (arguments.length === 0) this._modelType = PrecisionModel.FLOATING;
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Type) {
				const modelType = arguments[0];
				this._modelType = modelType;
				if (modelType === PrecisionModel.FIXED) this.setScale(1);
			} else if (typeof arguments[0] === "number") {
				const scale = arguments[0];
				this._modelType = PrecisionModel.FIXED;
				this.setScale(scale);
			} else if (arguments[0] instanceof PrecisionModel) {
				const pm = arguments[0];
				this._modelType = pm._modelType;
				this._scale = pm._scale;
			}
		}
	}
	static mostPrecise(pm1, pm2) {
		if (pm1.compareTo(pm2) >= 0) return pm1;
		return pm2;
	}
	equals(other) {
		if (!(other instanceof PrecisionModel)) return false;
		const otherPrecisionModel = other;
		return this._modelType === otherPrecisionModel._modelType && this._scale === otherPrecisionModel._scale;
	}
	compareTo(o) {
		const other = o;
		const sigDigits = this.getMaximumSignificantDigits();
		const otherSigDigits = other.getMaximumSignificantDigits();
		return Integer.compare(sigDigits, otherSigDigits);
	}
	getType() {
		return this._modelType;
	}
	toString() {
		let description = "UNKNOWN";
		if (this._modelType === PrecisionModel.FLOATING) description = "Floating";
		else if (this._modelType === PrecisionModel.FLOATING_SINGLE) description = "Floating-Single";
		else if (this._modelType === PrecisionModel.FIXED) description = "Fixed (Scale=" + this.getScale() + ")";
		return description;
	}
	makePrecise() {
		if (typeof arguments[0] === "number") {
			const val = arguments[0];
			if (Double.isNaN(val)) return val;
			if (this._modelType === PrecisionModel.FLOATING_SINGLE) return val;
			if (this._modelType === PrecisionModel.FIXED) return Math.round(val * this._scale) / this._scale;
			return val;
		} else if (arguments[0] instanceof Coordinate) {
			const coord = arguments[0];
			if (this._modelType === PrecisionModel.FLOATING) return null;
			coord.x = this.makePrecise(coord.x);
			coord.y = this.makePrecise(coord.y);
		}
	}
	getMaximumSignificantDigits() {
		let maxSigDigits = 16;
		if (this._modelType === PrecisionModel.FLOATING) maxSigDigits = 16;
		else if (this._modelType === PrecisionModel.FLOATING_SINGLE) maxSigDigits = 6;
		else if (this._modelType === PrecisionModel.FIXED) maxSigDigits = 1 + Math.trunc(Math.ceil(Math.log(this.getScale()) / Math.log(10)));
		return maxSigDigits;
	}
	setScale(scale) {
		this._scale = Math.abs(scale);
	}
	getScale() {
		return this._scale;
	}
	isFloating() {
		return this._modelType === PrecisionModel.FLOATING || this._modelType === PrecisionModel.FLOATING_SINGLE;
	}
	get interfaces_() {
		return [Serializable, Comparable];
	}
};
var Type = class Type {
	constructor() {
		Type.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._name = null;
		const name = arguments[0];
		this._name = name;
		Type.nameToTypeMap.put(name, this);
	}
	readResolve() {
		return Type.nameToTypeMap.get(this._name);
	}
	toString() {
		return this._name;
	}
	get interfaces_() {
		return [Serializable];
	}
};
Type.nameToTypeMap = new HashMap();
PrecisionModel.Type = Type;
PrecisionModel.FIXED = new Type("FIXED");
PrecisionModel.FLOATING = new Type("FLOATING");
PrecisionModel.FLOATING_SINGLE = new Type("FLOATING SINGLE");
PrecisionModel.maximumPreciseValue = 9007199254740992;
// node_modules/jsts/org/locationtech/jts/geom/MultiLineString.js
var MultiLineString = class MultiLineString extends GeometryCollection {
	constructor() {
		super();
		MultiLineString.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const lineStrings = arguments[0], factory = arguments[1];
		GeometryCollection.constructor_.call(this, lineStrings, factory);
	}
	copyInternal() {
		const lineStrings = new Array(this._geometries.length).fill(null);
		for (let i = 0; i < lineStrings.length; i++) lineStrings[i] = this._geometries[i].copy();
		return new MultiLineString(lineStrings, this._factory);
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			return super.equalsExact.call(this, other, tolerance);
		} else return super.equalsExact.apply(this, arguments);
	}
	getBoundaryDimension() {
		if (this.isClosed()) return Dimension.FALSE;
		return 0;
	}
	isClosed() {
		if (this.isEmpty()) return false;
		for (let i = 0; i < this._geometries.length; i++) if (!this._geometries[i].isClosed()) return false;
		return true;
	}
	getTypeCode() {
		return Geometry.TYPECODE_MULTILINESTRING;
	}
	getDimension() {
		return 1;
	}
	getBoundary() {
		throw new UnsupportedOperationException();
	}
	getGeometryType() {
		return Geometry.TYPENAME_MULTILINESTRING;
	}
	get interfaces_() {
		return [Lineal];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Puntal.js
var Puntal = class {};
// node_modules/jsts/java/lang/IllegalStateException.js
var IllegalStateException = class IllegalStateException extends Exception {
	constructor(message) {
		super(message);
		this.name = Object.keys({ IllegalStateException })[0];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Point.js
var Point = class Point extends Geometry {
	constructor() {
		super();
		Point.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._coordinates = null;
		const coordinates = arguments[0], factory = arguments[1];
		Geometry.constructor_.call(this, factory);
		this.init(coordinates);
	}
	computeEnvelopeInternal() {
		if (this.isEmpty()) return new Envelope();
		const env = new Envelope();
		env.expandToInclude(this._coordinates.getX(0), this._coordinates.getY(0));
		return env;
	}
	getCoordinates() {
		return this.isEmpty() ? [] : [this.getCoordinate()];
	}
	copyInternal() {
		return new Point(this._coordinates.copy(), this._factory);
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			if (this.isEmpty() && other.isEmpty()) return true;
			if (this.isEmpty() !== other.isEmpty()) return false;
			return this.equal(other.getCoordinate(), this.getCoordinate(), tolerance);
		} else return super.equalsExact.apply(this, arguments);
	}
	reverseInternal() {
		return this.getFactory().createPoint(this._coordinates.copy());
	}
	getTypeCode() {
		return Geometry.TYPECODE_POINT;
	}
	getDimension() {
		return 0;
	}
	getNumPoints() {
		return this.isEmpty() ? 0 : 1;
	}
	getX() {
		if (this.getCoordinate() === null) throw new IllegalStateException("getX called on empty Point");
		return this.getCoordinate().x;
	}
	getBoundary() {
		return this.getFactory().createGeometryCollection();
	}
	getGeometryType() {
		return Geometry.TYPENAME_POINT;
	}
	getCoordinateSequence() {
		return this._coordinates;
	}
	getY() {
		if (this.getCoordinate() === null) throw new IllegalStateException("getY called on empty Point");
		return this.getCoordinate().y;
	}
	isSimple() {
		return true;
	}
	normalize() {}
	getCoordinate() {
		return this._coordinates.size() !== 0 ? this._coordinates.getCoordinate(0) : null;
	}
	getBoundaryDimension() {
		return Dimension.FALSE;
	}
	compareToSameClass() {
		if (arguments.length === 1) {
			const point = arguments[0];
			return this.getCoordinate().compareTo(point.getCoordinate());
		} else if (arguments.length === 2) {
			const other = arguments[0], comp = arguments[1];
			const point = other;
			return comp.compare(this._coordinates, point._coordinates);
		}
	}
	apply() {
		if (hasInterface_default(arguments[0], CoordinateFilter)) {
			const filter = arguments[0];
			if (this.isEmpty()) return null;
			filter.filter(this.getCoordinate());
		} else if (hasInterface_default(arguments[0], CoordinateSequenceFilter)) {
			const filter = arguments[0];
			if (this.isEmpty()) return null;
			filter.filter(this._coordinates, 0);
			if (filter.isGeometryChanged()) this.geometryChanged();
		} else if (hasInterface_default(arguments[0], GeometryFilter)) arguments[0].filter(this);
		else if (hasInterface_default(arguments[0], GeometryComponentFilter)) arguments[0].filter(this);
	}
	isEmpty() {
		return this._coordinates.size() === 0;
	}
	init(coordinates) {
		if (coordinates === null) coordinates = this.getFactory().getCoordinateSequenceFactory().create([]);
		Assert.isTrue(coordinates.size() <= 1);
		this._coordinates = coordinates;
	}
	get interfaces_() {
		return [Puntal];
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/Area.js
var Area = class Area {
	static ofRingSigned() {
		if (arguments[0] instanceof Array) {
			const ring = arguments[0];
			if (ring.length < 3) return 0;
			let sum = 0;
			const x0 = ring[0].x;
			for (let i = 1; i < ring.length - 1; i++) {
				const x = ring[i].x - x0;
				const y1 = ring[i + 1].y;
				const y2 = ring[i - 1].y;
				sum += x * (y2 - y1);
			}
			return sum / 2;
		} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
			const ring = arguments[0];
			const n = ring.size();
			if (n < 3) return 0;
			const p0 = new Coordinate();
			const p1 = new Coordinate();
			const p2 = new Coordinate();
			ring.getCoordinate(0, p1);
			ring.getCoordinate(1, p2);
			const x0 = p1.x;
			p2.x -= x0;
			let sum = 0;
			for (let i = 1; i < n - 1; i++) {
				p0.y = p1.y;
				p1.x = p2.x;
				p1.y = p2.y;
				ring.getCoordinate(i + 1, p2);
				p2.x -= x0;
				sum += p1.x * (p0.y - p2.y);
			}
			return sum / 2;
		}
	}
	static ofRing() {
		if (arguments[0] instanceof Array) {
			const ring = arguments[0];
			return Math.abs(Area.ofRingSigned(ring));
		} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
			const ring = arguments[0];
			return Math.abs(Area.ofRingSigned(ring));
		}
	}
};
// node_modules/jsts/java/lang/StringBuffer.js
var StringBuffer = class {
	constructor(str) {
		this.str = str;
	}
	append(e) {
		this.str += e;
	}
	setCharAt(i, c) {
		this.str = this.str.substr(0, i) + c + this.str.substr(i + 1);
	}
	toString() {
		return this.str;
	}
};
// node_modules/jsts/org/locationtech/jts/math/DD.js
var DD = class DD {
	constructor() {
		DD.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._hi = 0;
		this._lo = 0;
		if (arguments.length === 0) this.init(0);
		else if (arguments.length === 1) {
			if (typeof arguments[0] === "number") {
				const x = arguments[0];
				this.init(x);
			} else if (arguments[0] instanceof DD) {
				const dd = arguments[0];
				this.init(dd);
			} else if (typeof arguments[0] === "string") {
				const str = arguments[0];
				DD.constructor_.call(this, DD.parse(str));
			}
		} else if (arguments.length === 2) {
			const hi = arguments[0], lo = arguments[1];
			this.init(hi, lo);
		}
	}
	static determinant() {
		if (typeof arguments[3] === "number" && typeof arguments[2] === "number" && typeof arguments[0] === "number" && typeof arguments[1] === "number") {
			const x1 = arguments[0], y1 = arguments[1], x2 = arguments[2], y2 = arguments[3];
			return DD.determinant(DD.valueOf(x1), DD.valueOf(y1), DD.valueOf(x2), DD.valueOf(y2));
		} else if (arguments[3] instanceof DD && arguments[2] instanceof DD && arguments[0] instanceof DD && arguments[1] instanceof DD) {
			const x1 = arguments[0], y1 = arguments[1], x2 = arguments[2], y2 = arguments[3];
			return x1.multiply(y2).selfSubtract(y1.multiply(x2));
		}
	}
	static sqr(x) {
		return DD.valueOf(x).selfMultiply(x);
	}
	static valueOf() {
		if (typeof arguments[0] === "string") {
			const str = arguments[0];
			return DD.parse(str);
		} else if (typeof arguments[0] === "number") {
			const x = arguments[0];
			return new DD(x);
		}
	}
	static sqrt(x) {
		return DD.valueOf(x).sqrt();
	}
	static parse(str) {
		let i = 0;
		const strlen = str.length;
		while (Character.isWhitespace(str.charAt(i))) i++;
		let isNegative = false;
		if (i < strlen) {
			const signCh = str.charAt(i);
			if (signCh === "-" || signCh === "+") {
				i++;
				if (signCh === "-") isNegative = true;
			}
		}
		const val = new DD();
		let numDigits = 0;
		let numBeforeDec = 0;
		let exp = 0;
		let hasDecimalChar = false;
		while (true) {
			if (i >= strlen) break;
			const ch = str.charAt(i);
			i++;
			if (Character.isDigit(ch)) {
				const d = ch - "0";
				val.selfMultiply(DD.TEN);
				val.selfAdd(d);
				numDigits++;
				continue;
			}
			if (ch === ".") {
				numBeforeDec = numDigits;
				hasDecimalChar = true;
				continue;
			}
			if (ch === "e" || ch === "E") {
				const expStr = str.substring(i);
				try {
					exp = Integer.parseInt(expStr);
				} catch (ex) {
					if (ex instanceof NumberFormatException) throw new NumberFormatException("Invalid exponent " + expStr + " in string " + str);
					else throw ex;
				}
				break;
			}
			throw new NumberFormatException("Unexpected character '" + ch + "' at position " + i + " in string " + str);
		}
		let val2 = val;
		if (!hasDecimalChar) numBeforeDec = numDigits;
		const numDecPlaces = numDigits - numBeforeDec - exp;
		if (numDecPlaces === 0) val2 = val;
		else if (numDecPlaces > 0) {
			const scale = DD.TEN.pow(numDecPlaces);
			val2 = val.divide(scale);
		} else if (numDecPlaces < 0) {
			const scale = DD.TEN.pow(-numDecPlaces);
			val2 = val.multiply(scale);
		}
		if (isNegative) return val2.negate();
		return val2;
	}
	static createNaN() {
		return new DD(Double.NaN, Double.NaN);
	}
	static copy(dd) {
		return new DD(dd);
	}
	static magnitude(x) {
		const xAbs = Math.abs(x);
		const xLog10 = Math.log(xAbs) / Math.log(10);
		let xMag = Math.trunc(Math.floor(xLog10));
		if (Math.pow(10, xMag) * 10 <= xAbs) xMag += 1;
		return xMag;
	}
	static stringOfChar(ch, len) {
		const buf = new StringBuffer();
		for (let i = 0; i < len; i++) buf.append(ch);
		return buf.toString();
	}
	le(y) {
		return this._hi < y._hi || this._hi === y._hi && this._lo <= y._lo;
	}
	extractSignificantDigits(insertDecimalPoint, magnitude) {
		let y = this.abs();
		let mag = DD.magnitude(y._hi);
		const scale = DD.TEN.pow(mag);
		y = y.divide(scale);
		if (y.gt(DD.TEN)) {
			y = y.divide(DD.TEN);
			mag += 1;
		} else if (y.lt(DD.ONE)) {
			y = y.multiply(DD.TEN);
			mag -= 1;
		}
		const decimalPointPos = mag + 1;
		const buf = new StringBuffer();
		const numDigits = DD.MAX_PRINT_DIGITS - 1;
		for (let i = 0; i <= numDigits; i++) {
			if (insertDecimalPoint && i === decimalPointPos) buf.append(".");
			const digit = Math.trunc(y._hi);
			if (digit < 0 || digit > 9) {}
			if (digit < 0) break;
			let rebiasBy10 = false;
			let digitChar = 0;
			if (digit > 9) {
				rebiasBy10 = true;
				digitChar = "9";
			} else digitChar = "0" + digit;
			buf.append(digitChar);
			y = y.subtract(DD.valueOf(digit)).multiply(DD.TEN);
			if (rebiasBy10) y.selfAdd(DD.TEN);
			let continueExtractingDigits = true;
			const remMag = DD.magnitude(y._hi);
			if (remMag < 0 && Math.abs(remMag) >= numDigits - i) continueExtractingDigits = false;
			if (!continueExtractingDigits) break;
		}
		magnitude[0] = mag;
		return buf.toString();
	}
	sqr() {
		return this.multiply(this);
	}
	getSpecialNumberString() {
		if (this.isZero()) return "0.0";
		if (this.isNaN()) return "NaN ";
		return null;
	}
	setValue() {
		if (arguments[0] instanceof DD) {
			const value = arguments[0];
			this.init(value);
			return this;
		} else if (typeof arguments[0] === "number") {
			const value = arguments[0];
			this.init(value);
			return this;
		}
	}
	multiply() {
		if (arguments[0] instanceof DD) {
			const y = arguments[0];
			if (y.isNaN()) return DD.createNaN();
			return DD.copy(this).selfMultiply(y);
		} else if (typeof arguments[0] === "number") {
			const y = arguments[0];
			if (Double.isNaN(y)) return DD.createNaN();
			return DD.copy(this).selfMultiply(y, 0);
		}
	}
	isNaN() {
		return Double.isNaN(this._hi);
	}
	reciprocal() {
		let hc = null, tc = null, hy = null, ty = null, C = null, c = null, U = null, u = null;
		C = 1 / this._hi;
		c = DD.SPLIT * C;
		hc = c - C;
		u = DD.SPLIT * this._hi;
		hc = c - hc;
		tc = C - hc;
		hy = u - this._hi;
		U = C * this._hi;
		hy = u - hy;
		ty = this._hi - hy;
		u = hc * hy - U + hc * ty + tc * hy + tc * ty;
		c = (1 - U - u - C * this._lo) / this._hi;
		const zhi = C + c;
		const zlo = C - zhi + c;
		return new DD(zhi, zlo);
	}
	doubleValue() {
		return this._hi + this._lo;
	}
	subtract() {
		if (arguments[0] instanceof DD) {
			const y = arguments[0];
			return this.add(y.negate());
		} else if (typeof arguments[0] === "number") {
			const y = arguments[0];
			return this.add(-y);
		}
	}
	equals() {
		if (arguments.length === 1 && arguments[0] instanceof DD) {
			const y = arguments[0];
			return this._hi === y._hi && this._lo === y._lo;
		}
	}
	isZero() {
		return this._hi === 0 && this._lo === 0;
	}
	selfSubtract() {
		if (arguments[0] instanceof DD) {
			const y = arguments[0];
			if (this.isNaN()) return this;
			return this.selfAdd(-y._hi, -y._lo);
		} else if (typeof arguments[0] === "number") {
			const y = arguments[0];
			if (this.isNaN()) return this;
			return this.selfAdd(-y, 0);
		}
	}
	min(x) {
		if (this.le(x)) return this;
		else return x;
	}
	selfDivide() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof DD) {
				const y = arguments[0];
				return this.selfDivide(y._hi, y._lo);
			} else if (typeof arguments[0] === "number") {
				const y = arguments[0];
				return this.selfDivide(y, 0);
			}
		} else if (arguments.length === 2) {
			const yhi = arguments[0], ylo = arguments[1];
			let hc = null, tc = null, hy = null, ty = null, C = null, c = null, U = null, u = null;
			C = this._hi / yhi;
			c = DD.SPLIT * C;
			hc = c - C;
			u = DD.SPLIT * yhi;
			hc = c - hc;
			tc = C - hc;
			hy = u - yhi;
			U = C * yhi;
			hy = u - hy;
			ty = yhi - hy;
			u = hc * hy - U + hc * ty + tc * hy + tc * ty;
			c = (this._hi - U - u + this._lo - C * ylo) / yhi;
			u = C + c;
			this._hi = u;
			this._lo = C - u + c;
			return this;
		}
	}
	dump() {
		return "DD<" + this._hi + ", " + this._lo + ">";
	}
	divide() {
		if (arguments[0] instanceof DD) {
			const y = arguments[0];
			let hc = null, tc = null, hy = null, ty = null, C = null, c = null, U = null, u = null;
			C = this._hi / y._hi;
			c = DD.SPLIT * C;
			hc = c - C;
			u = DD.SPLIT * y._hi;
			hc = c - hc;
			tc = C - hc;
			hy = u - y._hi;
			U = C * y._hi;
			hy = u - hy;
			ty = y._hi - hy;
			u = hc * hy - U + hc * ty + tc * hy + tc * ty;
			c = (this._hi - U - u + this._lo - C * y._lo) / y._hi;
			u = C + c;
			const zhi = u;
			const zlo = C - u + c;
			return new DD(zhi, zlo);
		} else if (typeof arguments[0] === "number") {
			const y = arguments[0];
			if (Double.isNaN(y)) return DD.createNaN();
			return DD.copy(this).selfDivide(y, 0);
		}
	}
	ge(y) {
		return this._hi > y._hi || this._hi === y._hi && this._lo >= y._lo;
	}
	pow(exp) {
		if (exp === 0) return DD.valueOf(1);
		let r = new DD(this);
		let s = DD.valueOf(1);
		let n = Math.abs(exp);
		if (n > 1) while (n > 0) {
			if (n % 2 === 1) s.selfMultiply(r);
			n /= 2;
			if (n > 0) r = r.sqr();
		}
		else s = r;
		if (exp < 0) return s.reciprocal();
		return s;
	}
	ceil() {
		if (this.isNaN()) return DD.NaN;
		const fhi = Math.ceil(this._hi);
		let flo = 0;
		if (fhi === this._hi) flo = Math.ceil(this._lo);
		return new DD(fhi, flo);
	}
	compareTo(o) {
		const other = o;
		if (this._hi < other._hi) return -1;
		if (this._hi > other._hi) return 1;
		if (this._lo < other._lo) return -1;
		if (this._lo > other._lo) return 1;
		return 0;
	}
	rint() {
		if (this.isNaN()) return this;
		return this.add(.5).floor();
	}
	max(x) {
		if (this.ge(x)) return this;
		else return x;
	}
	sqrt() {
		if (this.isZero()) return DD.valueOf(0);
		if (this.isNegative()) return DD.NaN;
		const x = 1 / Math.sqrt(this._hi);
		const ax = this._hi * x;
		const axdd = DD.valueOf(ax);
		const d2 = this.subtract(axdd.sqr())._hi * (x * .5);
		return axdd.add(d2);
	}
	selfAdd() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof DD) {
				const y = arguments[0];
				return this.selfAdd(y._hi, y._lo);
			} else if (typeof arguments[0] === "number") {
				const y = arguments[0];
				let H = null, h = null, S = null, s = null, e = null, f = null;
				S = this._hi + y;
				e = S - this._hi;
				s = S - e;
				s = y - e + (this._hi - s);
				f = s + this._lo;
				H = S + f;
				h = f + (S - H);
				this._hi = H + h;
				this._lo = h + (H - this._hi);
				return this;
			}
		} else if (arguments.length === 2) {
			const yhi = arguments[0], ylo = arguments[1];
			let H = null, h = null, T = null, t = null, S = null, s = null, e = null, f = null;
			S = this._hi + yhi;
			T = this._lo + ylo;
			e = S - this._hi;
			f = T - this._lo;
			s = S - e;
			t = T - f;
			s = yhi - e + (this._hi - s);
			t = ylo - f + (this._lo - t);
			e = s + T;
			H = S + e;
			h = e + (S - H);
			e = t + h;
			const zhi = H + e;
			const zlo = e + (H - zhi);
			this._hi = zhi;
			this._lo = zlo;
			return this;
		}
	}
	selfMultiply() {
		if (arguments.length === 1) {
			if (arguments[0] instanceof DD) {
				const y = arguments[0];
				return this.selfMultiply(y._hi, y._lo);
			} else if (typeof arguments[0] === "number") {
				const y = arguments[0];
				return this.selfMultiply(y, 0);
			}
		} else if (arguments.length === 2) {
			const yhi = arguments[0], ylo = arguments[1];
			let hx = null, tx = null, hy = null, ty = null, C = null, c = null;
			C = DD.SPLIT * this._hi;
			hx = C - this._hi;
			c = DD.SPLIT * yhi;
			hx = C - hx;
			tx = this._hi - hx;
			hy = c - yhi;
			C = this._hi * yhi;
			hy = c - hy;
			ty = yhi - hy;
			c = hx * hy - C + hx * ty + tx * hy + tx * ty + (this._hi * ylo + this._lo * yhi);
			const zhi = C + c;
			hx = C - zhi;
			const zlo = c + hx;
			this._hi = zhi;
			this._lo = zlo;
			return this;
		}
	}
	selfSqr() {
		return this.selfMultiply(this);
	}
	floor() {
		if (this.isNaN()) return DD.NaN;
		const fhi = Math.floor(this._hi);
		let flo = 0;
		if (fhi === this._hi) flo = Math.floor(this._lo);
		return new DD(fhi, flo);
	}
	negate() {
		if (this.isNaN()) return this;
		return new DD(-this._hi, -this._lo);
	}
	clone() {
		try {
			return null;
		} catch (ex) {
			if (ex instanceof CloneNotSupportedException) return null;
			else throw ex;
		}
	}
	intValue() {
		return Math.trunc(this._hi);
	}
	toString() {
		const mag = DD.magnitude(this._hi);
		if (mag >= -3 && mag <= 20) return this.toStandardNotation();
		return this.toSciNotation();
	}
	toStandardNotation() {
		const specialStr = this.getSpecialNumberString();
		if (specialStr !== null) return specialStr;
		const magnitude = new Array(1).fill(null);
		const sigDigits = this.extractSignificantDigits(true, magnitude);
		const decimalPointPos = magnitude[0] + 1;
		let num = sigDigits;
		if (sigDigits.charAt(0) === ".") num = "0" + sigDigits;
		else if (decimalPointPos < 0) num = "0." + DD.stringOfChar("0", -decimalPointPos) + sigDigits;
		else if (sigDigits.indexOf(".") === -1) {
			const numZeroes = decimalPointPos - sigDigits.length;
			num = sigDigits + DD.stringOfChar("0", numZeroes) + ".0";
		}
		if (this.isNegative()) return "-" + num;
		return num;
	}
	toSciNotation() {
		if (this.isZero()) return DD.SCI_NOT_ZERO;
		const specialStr = this.getSpecialNumberString();
		if (specialStr !== null) return specialStr;
		const magnitude = new Array(1).fill(null);
		const digits = this.extractSignificantDigits(false, magnitude);
		const expStr = DD.SCI_NOT_EXPONENT_CHAR + magnitude[0];
		if (digits.charAt(0) === "0") throw new IllegalStateException("Found leading zero: " + digits);
		let trailingDigits = "";
		if (digits.length > 1) trailingDigits = digits.substring(1);
		const digitsWithDecimal = digits.charAt(0) + "." + trailingDigits;
		if (this.isNegative()) return "-" + digitsWithDecimal + expStr;
		return digitsWithDecimal + expStr;
	}
	abs() {
		if (this.isNaN()) return DD.NaN;
		if (this.isNegative()) return this.negate();
		return new DD(this);
	}
	isPositive() {
		return this._hi > 0 || this._hi === 0 && this._lo > 0;
	}
	lt(y) {
		return this._hi < y._hi || this._hi === y._hi && this._lo < y._lo;
	}
	add() {
		if (arguments[0] instanceof DD) {
			const y = arguments[0];
			return DD.copy(this).selfAdd(y);
		} else if (typeof arguments[0] === "number") {
			const y = arguments[0];
			return DD.copy(this).selfAdd(y);
		}
	}
	init() {
		if (arguments.length === 1) {
			if (typeof arguments[0] === "number") {
				const x = arguments[0];
				this._hi = x;
				this._lo = 0;
			} else if (arguments[0] instanceof DD) {
				const dd = arguments[0];
				this._hi = dd._hi;
				this._lo = dd._lo;
			}
		} else if (arguments.length === 2) {
			const hi = arguments[0], lo = arguments[1];
			this._hi = hi;
			this._lo = lo;
		}
	}
	gt(y) {
		return this._hi > y._hi || this._hi === y._hi && this._lo > y._lo;
	}
	isNegative() {
		return this._hi < 0 || this._hi === 0 && this._lo < 0;
	}
	trunc() {
		if (this.isNaN()) return DD.NaN;
		if (this.isPositive()) return this.floor();
		else return this.ceil();
	}
	signum() {
		if (this._hi > 0) return 1;
		if (this._hi < 0) return -1;
		if (this._lo > 0) return 1;
		if (this._lo < 0) return -1;
		return 0;
	}
	get interfaces_() {
		return [
			Serializable,
			Comparable,
			Clonable
		];
	}
};
DD.PI = new DD(3.141592653589793, 12246467991473532e-32);
DD.TWO_PI = new DD(6.283185307179586, 24492935982947064e-32);
DD.PI_2 = new DD(1.5707963267948966, 6123233995736766e-32);
DD.E = new DD(2.718281828459045, 14456468917292502e-32);
DD.NaN = new DD(Double.NaN, Double.NaN);
DD.EPS = 123259516440783e-46;
DD.SPLIT = 134217729;
DD.MAX_PRINT_DIGITS = 32;
DD.TEN = DD.valueOf(10);
DD.ONE = DD.valueOf(1);
DD.SCI_NOT_EXPONENT_CHAR = "E";
DD.SCI_NOT_ZERO = "0.0E0";
// node_modules/jsts/org/locationtech/jts/algorithm/CGAlgorithmsDD.js
var CGAlgorithmsDD = class CGAlgorithmsDD {
	static orientationIndex(p1, p2, q) {
		const index = CGAlgorithmsDD.orientationIndexFilter(p1, p2, q);
		if (index <= 1) return index;
		const dx1 = DD.valueOf(p2.x).selfAdd(-p1.x);
		const dy1 = DD.valueOf(p2.y).selfAdd(-p1.y);
		const dx2 = DD.valueOf(q.x).selfAdd(-p2.x);
		const dy2 = DD.valueOf(q.y).selfAdd(-p2.y);
		return dx1.selfMultiply(dy2).selfSubtract(dy1.selfMultiply(dx2)).signum();
	}
	static signOfDet2x2() {
		if (arguments[3] instanceof DD && arguments[2] instanceof DD && arguments[0] instanceof DD && arguments[1] instanceof DD) {
			const x1 = arguments[0], y1 = arguments[1], x2 = arguments[2], y2 = arguments[3];
			return x1.multiply(y2).selfSubtract(y1.multiply(x2)).signum();
		} else if (typeof arguments[3] === "number" && typeof arguments[2] === "number" && typeof arguments[0] === "number" && typeof arguments[1] === "number") {
			const dx1 = arguments[0], dy1 = arguments[1], dx2 = arguments[2], dy2 = arguments[3];
			const x1 = DD.valueOf(dx1);
			const y1 = DD.valueOf(dy1);
			const x2 = DD.valueOf(dx2);
			const y2 = DD.valueOf(dy2);
			return x1.multiply(y2).selfSubtract(y1.multiply(x2)).signum();
		}
	}
	static intersection(p1, p2, q1, q2) {
		const px = new DD(p1.y).selfSubtract(p2.y);
		const py = new DD(p2.x).selfSubtract(p1.x);
		const pw = new DD(p1.x).selfMultiply(p2.y).selfSubtract(new DD(p2.x).selfMultiply(p1.y));
		const qx = new DD(q1.y).selfSubtract(q2.y);
		const qy = new DD(q2.x).selfSubtract(q1.x);
		const qw = new DD(q1.x).selfMultiply(q2.y).selfSubtract(new DD(q2.x).selfMultiply(q1.y));
		const x = py.multiply(qw).selfSubtract(qy.multiply(pw));
		const y = qx.multiply(pw).selfSubtract(px.multiply(qw));
		const w = px.multiply(qy).selfSubtract(qx.multiply(py));
		const xInt = x.selfDivide(w).doubleValue();
		const yInt = y.selfDivide(w).doubleValue();
		if (Double.isNaN(xInt) || Double.isInfinite(xInt) || Double.isNaN(yInt) || Double.isInfinite(yInt)) return null;
		return new Coordinate(xInt, yInt);
	}
	static orientationIndexFilter(pa, pb, pc) {
		let detsum = null;
		const detleft = (pa.x - pc.x) * (pb.y - pc.y);
		const detright = (pa.y - pc.y) * (pb.x - pc.x);
		const det = detleft - detright;
		if (detleft > 0) if (detright <= 0) return CGAlgorithmsDD.signum(det);
		else detsum = detleft + detright;
		else if (detleft < 0) if (detright >= 0) return CGAlgorithmsDD.signum(det);
		else detsum = -detleft - detright;
		else return CGAlgorithmsDD.signum(det);
		const errbound = CGAlgorithmsDD.DP_SAFE_EPSILON * detsum;
		if (det >= errbound || -det >= errbound) return CGAlgorithmsDD.signum(det);
		return 2;
	}
	static signum(x) {
		if (x > 0) return 1;
		if (x < 0) return -1;
		return 0;
	}
};
CGAlgorithmsDD.DP_SAFE_EPSILON = 1e-15;
// node_modules/jsts/org/locationtech/jts/algorithm/Orientation.js
var Orientation = class Orientation {
	static isCCW() {
		if (arguments[0] instanceof Array) {
			const ring = arguments[0];
			const nPts = ring.length - 1;
			if (nPts < 3) throw new IllegalArgumentException("Ring has fewer than 4 points, so orientation cannot be determined");
			let hiPt = ring[0];
			let hiIndex = 0;
			for (let i = 1; i <= nPts; i++) {
				const p = ring[i];
				if (p.y > hiPt.y) {
					hiPt = p;
					hiIndex = i;
				}
			}
			let iPrev = hiIndex;
			do {
				iPrev = iPrev - 1;
				if (iPrev < 0) iPrev = nPts;
			} while (ring[iPrev].equals2D(hiPt) && iPrev !== hiIndex);
			let iNext = hiIndex;
			do
				iNext = (iNext + 1) % nPts;
			while (ring[iNext].equals2D(hiPt) && iNext !== hiIndex);
			const prev = ring[iPrev];
			const next = ring[iNext];
			if (prev.equals2D(hiPt) || next.equals2D(hiPt) || prev.equals2D(next)) return false;
			const disc = Orientation.index(prev, hiPt, next);
			let isCCW = null;
			if (disc === 0) isCCW = prev.x > next.x;
			else isCCW = disc > 0;
			return isCCW;
		} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
			const ring = arguments[0];
			const nPts = ring.size() - 1;
			if (nPts < 3) throw new IllegalArgumentException("Ring has fewer than 4 points, so orientation cannot be determined");
			let hiPt = ring.getCoordinate(0);
			let hiIndex = 0;
			for (let i = 1; i <= nPts; i++) {
				const p = ring.getCoordinate(i);
				if (p.y > hiPt.y) {
					hiPt = p;
					hiIndex = i;
				}
			}
			let prev = null;
			let iPrev = hiIndex;
			do {
				iPrev = iPrev - 1;
				if (iPrev < 0) iPrev = nPts;
				prev = ring.getCoordinate(iPrev);
			} while (prev.equals2D(hiPt) && iPrev !== hiIndex);
			let next = null;
			let iNext = hiIndex;
			do {
				iNext = (iNext + 1) % nPts;
				next = ring.getCoordinate(iNext);
			} while (next.equals2D(hiPt) && iNext !== hiIndex);
			if (prev.equals2D(hiPt) || next.equals2D(hiPt) || prev.equals2D(next)) return false;
			const disc = Orientation.index(prev, hiPt, next);
			let isCCW = null;
			if (disc === 0) isCCW = prev.x > next.x;
			else isCCW = disc > 0;
			return isCCW;
		}
	}
	static index(p1, p2, q) {
		return CGAlgorithmsDD.orientationIndex(p1, p2, q);
	}
};
Orientation.CLOCKWISE = -1;
Orientation.RIGHT = Orientation.CLOCKWISE;
Orientation.COUNTERCLOCKWISE = 1;
Orientation.LEFT = Orientation.COUNTERCLOCKWISE;
Orientation.COLLINEAR = 0;
Orientation.STRAIGHT = Orientation.COLLINEAR;
// node_modules/jsts/org/locationtech/jts/geom/Polygon.js
var Polygon = class Polygon extends Geometry {
	constructor() {
		super();
		Polygon.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._shell = null;
		this._holes = null;
		let shell = arguments[0], holes = arguments[1], factory = arguments[2];
		Geometry.constructor_.call(this, factory);
		if (shell === null) shell = this.getFactory().createLinearRing();
		if (holes === null) holes = [];
		if (Geometry.hasNullElements(holes)) throw new IllegalArgumentException("holes must not contain null elements");
		if (shell.isEmpty() && Geometry.hasNonEmptyElements(holes)) throw new IllegalArgumentException("shell is empty but holes are not");
		this._shell = shell;
		this._holes = holes;
	}
	computeEnvelopeInternal() {
		return this._shell.getEnvelopeInternal();
	}
	getCoordinates() {
		if (this.isEmpty()) return [];
		const coordinates = new Array(this.getNumPoints()).fill(null);
		let k = -1;
		const shellCoordinates = this._shell.getCoordinates();
		for (let x = 0; x < shellCoordinates.length; x++) {
			k++;
			coordinates[k] = shellCoordinates[x];
		}
		for (let i = 0; i < this._holes.length; i++) {
			const childCoordinates = this._holes[i].getCoordinates();
			for (let j = 0; j < childCoordinates.length; j++) {
				k++;
				coordinates[k] = childCoordinates[j];
			}
		}
		return coordinates;
	}
	getArea() {
		let area = 0;
		area += Area.ofRing(this._shell.getCoordinateSequence());
		for (let i = 0; i < this._holes.length; i++) area -= Area.ofRing(this._holes[i].getCoordinateSequence());
		return area;
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			const otherPolygon = other;
			const thisShell = this._shell;
			const otherPolygonShell = otherPolygon._shell;
			if (!thisShell.equalsExact(otherPolygonShell, tolerance)) return false;
			if (this._holes.length !== otherPolygon._holes.length) return false;
			for (let i = 0; i < this._holes.length; i++) if (!this._holes[i].equalsExact(otherPolygon._holes[i], tolerance)) return false;
			return true;
		} else return super.equalsExact.apply(this, arguments);
	}
	reverseInternal() {
		const shell = this.getExteriorRing().reverse();
		const holes = new Array(this.getNumInteriorRing()).fill(null);
		for (let i = 0; i < holes.length; i++) holes[i] = this.getInteriorRingN(i).reverse();
		return this.getFactory().createPolygon(shell, holes);
	}
	getTypeCode() {
		return Geometry.TYPECODE_POLYGON;
	}
	getDimension() {
		return 2;
	}
	getBoundary() {
		if (this.isEmpty()) return this.getFactory().createMultiLineString();
		const rings = new Array(this._holes.length + 1).fill(null);
		rings[0] = this._shell;
		for (let i = 0; i < this._holes.length; i++) rings[i + 1] = this._holes[i];
		if (rings.length <= 1) return this.getFactory().createLinearRing(rings[0].getCoordinateSequence());
		return this.getFactory().createMultiLineString(rings);
	}
	getGeometryType() {
		return Geometry.TYPENAME_POLYGON;
	}
	getExteriorRing() {
		return this._shell;
	}
	copyInternal() {
		const shellCopy = this._shell.copy();
		const holeCopies = new Array(this._holes.length).fill(null);
		for (let i = 0; i < this._holes.length; i++) holeCopies[i] = this._holes[i].copy();
		return new Polygon(shellCopy, holeCopies, this._factory);
	}
	isRectangle() {
		if (this.getNumInteriorRing() !== 0) return false;
		if (this._shell === null) return false;
		if (this._shell.getNumPoints() !== 5) return false;
		const seq = this._shell.getCoordinateSequence();
		const env = this.getEnvelopeInternal();
		for (let i = 0; i < 5; i++) {
			const x = seq.getX(i);
			if (!(x === env.getMinX() || x === env.getMaxX())) return false;
			const y = seq.getY(i);
			if (!(y === env.getMinY() || y === env.getMaxY())) return false;
		}
		let prevX = seq.getX(0);
		let prevY = seq.getY(0);
		for (let i = 1; i <= 4; i++) {
			const x = seq.getX(i);
			const y = seq.getY(i);
			if (x !== prevX === (y !== prevY)) return false;
			prevX = x;
			prevY = y;
		}
		return true;
	}
	normalize() {
		if (arguments.length === 0) {
			this._shell = this.normalized(this._shell, true);
			for (let i = 0; i < this._holes.length; i++) this._holes[i] = this.normalized(this._holes[i], false);
			Arrays.sort(this._holes);
		} else if (arguments.length === 2) {
			const ring = arguments[0], clockwise = arguments[1];
			if (ring.isEmpty()) return null;
			const seq = ring.getCoordinateSequence();
			const minCoordinateIndex = CoordinateSequences.minCoordinateIndex(seq, 0, seq.size() - 2);
			CoordinateSequences.scroll(seq, minCoordinateIndex, true);
			if (Orientation.isCCW(seq) === clockwise) CoordinateSequences.reverse(seq);
		}
	}
	getCoordinate() {
		return this._shell.getCoordinate();
	}
	getNumInteriorRing() {
		return this._holes.length;
	}
	getBoundaryDimension() {
		return 1;
	}
	getLength() {
		let len = 0;
		len += this._shell.getLength();
		for (let i = 0; i < this._holes.length; i++) len += this._holes[i].getLength();
		return len;
	}
	getNumPoints() {
		let numPoints = this._shell.getNumPoints();
		for (let i = 0; i < this._holes.length; i++) numPoints += this._holes[i].getNumPoints();
		return numPoints;
	}
	convexHull() {
		return this.getExteriorRing().convexHull();
	}
	normalized(ring, clockwise) {
		const res = ring.copy();
		this.normalize(res, clockwise);
		return res;
	}
	compareToSameClass() {
		if (arguments.length === 1) {
			const o = arguments[0];
			const thisShell = this._shell;
			const otherShell = o._shell;
			return thisShell.compareToSameClass(otherShell);
		} else if (arguments.length === 2) {
			const o = arguments[0], comp = arguments[1];
			const poly = o;
			const thisShell = this._shell;
			const otherShell = poly._shell;
			const shellComp = thisShell.compareToSameClass(otherShell, comp);
			if (shellComp !== 0) return shellComp;
			const nHole1 = this.getNumInteriorRing();
			const nHole2 = poly.getNumInteriorRing();
			let i = 0;
			while (i < nHole1 && i < nHole2) {
				const thisHole = this.getInteriorRingN(i);
				const otherHole = poly.getInteriorRingN(i);
				const holeComp = thisHole.compareToSameClass(otherHole, comp);
				if (holeComp !== 0) return holeComp;
				i++;
			}
			if (i < nHole1) return 1;
			if (i < nHole2) return -1;
			return 0;
		}
	}
	apply() {
		if (hasInterface_default(arguments[0], CoordinateFilter)) {
			const filter = arguments[0];
			this._shell.apply(filter);
			for (let i = 0; i < this._holes.length; i++) this._holes[i].apply(filter);
		} else if (hasInterface_default(arguments[0], CoordinateSequenceFilter)) {
			const filter = arguments[0];
			this._shell.apply(filter);
			if (!filter.isDone()) for (let i = 0; i < this._holes.length; i++) {
				this._holes[i].apply(filter);
				if (filter.isDone()) break;
			}
			if (filter.isGeometryChanged()) this.geometryChanged();
		} else if (hasInterface_default(arguments[0], GeometryFilter)) arguments[0].filter(this);
		else if (hasInterface_default(arguments[0], GeometryComponentFilter)) {
			const filter = arguments[0];
			filter.filter(this);
			this._shell.apply(filter);
			for (let i = 0; i < this._holes.length; i++) this._holes[i].apply(filter);
		}
	}
	isEmpty() {
		return this._shell.isEmpty();
	}
	getInteriorRingN(n) {
		return this._holes[n];
	}
	get interfaces_() {
		return [Polygonal];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/MultiPoint.js
var MultiPoint = class MultiPoint extends GeometryCollection {
	constructor() {
		super();
		MultiPoint.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const points = arguments[0], factory = arguments[1];
		GeometryCollection.constructor_.call(this, points, factory);
	}
	equalsExact() {
		if (arguments.length === 2 && typeof arguments[1] === "number" && arguments[0] instanceof Geometry) {
			const other = arguments[0], tolerance = arguments[1];
			if (!this.isEquivalentClass(other)) return false;
			return super.equalsExact.call(this, other, tolerance);
		} else return super.equalsExact.apply(this, arguments);
	}
	getTypeCode() {
		return Geometry.TYPECODE_MULTIPOINT;
	}
	getDimension() {
		return 0;
	}
	getBoundary() {
		return this.getFactory().createGeometryCollection();
	}
	getGeometryType() {
		return Geometry.TYPENAME_MULTIPOINT;
	}
	copyInternal() {
		const points = new Array(this._geometries.length).fill(null);
		for (let i = 0; i < points.length; i++) points[i] = this._geometries[i].copy();
		return new MultiPoint(points, this._factory);
	}
	isValid() {
		return true;
	}
	getCoordinate() {
		if (arguments.length === 1 && Number.isInteger(arguments[0])) {
			const n = arguments[0];
			return this._geometries[n].getCoordinate();
		} else return super.getCoordinate.apply(this, arguments);
	}
	getBoundaryDimension() {
		return Dimension.FALSE;
	}
	get interfaces_() {
		return [Puntal];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/GeometryFactory.js
var GeometryFactory = class GeometryFactory {
	constructor() {
		GeometryFactory.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._precisionModel = null;
		this._coordinateSequenceFactory = null;
		this._SRID = null;
		if (arguments.length === 0) GeometryFactory.constructor_.call(this, new PrecisionModel(), 0);
		else if (arguments.length === 1) {
			if (hasInterface_default(arguments[0], CoordinateSequenceFactory)) {
				const coordinateSequenceFactory = arguments[0];
				GeometryFactory.constructor_.call(this, new PrecisionModel(), 0, coordinateSequenceFactory);
			} else if (arguments[0] instanceof PrecisionModel) {
				const precisionModel = arguments[0];
				GeometryFactory.constructor_.call(this, precisionModel, 0, GeometryFactory.getDefaultCoordinateSequenceFactory());
			}
		} else if (arguments.length === 2) {
			const precisionModel = arguments[0], SRID = arguments[1];
			GeometryFactory.constructor_.call(this, precisionModel, SRID, GeometryFactory.getDefaultCoordinateSequenceFactory());
		} else if (arguments.length === 3) {
			const precisionModel = arguments[0], SRID = arguments[1], coordinateSequenceFactory = arguments[2];
			this._precisionModel = precisionModel;
			this._coordinateSequenceFactory = coordinateSequenceFactory;
			this._SRID = SRID;
		}
	}
	static toMultiPolygonArray(multiPolygons) {
		const multiPolygonArray = new Array(multiPolygons.size()).fill(null);
		return multiPolygons.toArray(multiPolygonArray);
	}
	static toGeometryArray(geometries) {
		if (geometries === null) return null;
		const geometryArray = new Array(geometries.size()).fill(null);
		return geometries.toArray(geometryArray);
	}
	static getDefaultCoordinateSequenceFactory() {
		return CoordinateArraySequenceFactory.instance();
	}
	static toMultiLineStringArray(multiLineStrings) {
		const multiLineStringArray = new Array(multiLineStrings.size()).fill(null);
		return multiLineStrings.toArray(multiLineStringArray);
	}
	static toLineStringArray(lineStrings) {
		const lineStringArray = new Array(lineStrings.size()).fill(null);
		return lineStrings.toArray(lineStringArray);
	}
	static toMultiPointArray(multiPoints) {
		const multiPointArray = new Array(multiPoints.size()).fill(null);
		return multiPoints.toArray(multiPointArray);
	}
	static toLinearRingArray(linearRings) {
		const linearRingArray = new Array(linearRings.size()).fill(null);
		return linearRings.toArray(linearRingArray);
	}
	static toPointArray(points) {
		const pointArray = new Array(points.size()).fill(null);
		return points.toArray(pointArray);
	}
	static toPolygonArray(polygons) {
		const polygonArray = new Array(polygons.size()).fill(null);
		return polygons.toArray(polygonArray);
	}
	static createPointFromInternalCoord(coord, exemplar) {
		exemplar.getPrecisionModel().makePrecise(coord);
		return exemplar.getFactory().createPoint(coord);
	}
	createEmpty(dimension) {
		switch (dimension) {
			case -1: return this.createGeometryCollection();
			case 0: return this.createPoint();
			case 1: return this.createLineString();
			case 2: return this.createPolygon();
			default: throw new IllegalArgumentException("Invalid dimension: " + dimension);
		}
	}
	toGeometry(envelope) {
		if (envelope.isNull()) return this.createPoint();
		if (envelope.getMinX() === envelope.getMaxX() && envelope.getMinY() === envelope.getMaxY()) return this.createPoint(new Coordinate(envelope.getMinX(), envelope.getMinY()));
		if (envelope.getMinX() === envelope.getMaxX() || envelope.getMinY() === envelope.getMaxY()) return this.createLineString([new Coordinate(envelope.getMinX(), envelope.getMinY()), new Coordinate(envelope.getMaxX(), envelope.getMaxY())]);
		return this.createPolygon(this.createLinearRing([
			new Coordinate(envelope.getMinX(), envelope.getMinY()),
			new Coordinate(envelope.getMinX(), envelope.getMaxY()),
			new Coordinate(envelope.getMaxX(), envelope.getMaxY()),
			new Coordinate(envelope.getMaxX(), envelope.getMinY()),
			new Coordinate(envelope.getMinX(), envelope.getMinY())
		]), null);
	}
	createLineString() {
		if (arguments.length === 0) return this.createLineString(this.getCoordinateSequenceFactory().create([]));
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Array) {
				const coordinates = arguments[0];
				return this.createLineString(coordinates !== null ? this.getCoordinateSequenceFactory().create(coordinates) : null);
			} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const coordinates = arguments[0];
				return new LineString(coordinates, this);
			}
		}
	}
	createMultiLineString() {
		if (arguments.length === 0) return new MultiLineString(null, this);
		else if (arguments.length === 1) {
			const lineStrings = arguments[0];
			return new MultiLineString(lineStrings, this);
		}
	}
	createPolygon() {
		if (arguments.length === 0) return this.createPolygon(null, null);
		else if (arguments.length === 1) {
			if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const shell = arguments[0];
				return this.createPolygon(this.createLinearRing(shell));
			} else if (arguments[0] instanceof Array) {
				const shell = arguments[0];
				return this.createPolygon(this.createLinearRing(shell));
			} else if (arguments[0] instanceof LinearRing) {
				const shell = arguments[0];
				return this.createPolygon(shell, null);
			}
		} else if (arguments.length === 2) {
			const shell = arguments[0], holes = arguments[1];
			return new Polygon(shell, holes, this);
		}
	}
	getSRID() {
		return this._SRID;
	}
	createGeometryCollection() {
		if (arguments.length === 0) return new GeometryCollection(null, this);
		else if (arguments.length === 1) {
			const geometries = arguments[0];
			return new GeometryCollection(geometries, this);
		}
	}
	getPrecisionModel() {
		return this._precisionModel;
	}
	createLinearRing() {
		if (arguments.length === 0) return this.createLinearRing(this.getCoordinateSequenceFactory().create([]));
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Array) {
				const coordinates = arguments[0];
				return this.createLinearRing(coordinates !== null ? this.getCoordinateSequenceFactory().create(coordinates) : null);
			} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const coordinates = arguments[0];
				return new LinearRing(coordinates, this);
			}
		}
	}
	createMultiPolygon() {
		if (arguments.length === 0) return new MultiPolygon(null, this);
		else if (arguments.length === 1) {
			const polygons = arguments[0];
			return new MultiPolygon(polygons, this);
		}
	}
	createMultiPoint() {
		if (arguments.length === 0) return new MultiPoint(null, this);
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Array) {
				const point = arguments[0];
				return new MultiPoint(point, this);
			} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const coordinates = arguments[0];
				if (coordinates === null) return this.createMultiPoint(new Array(0).fill(null));
				const points = new Array(coordinates.size()).fill(null);
				for (let i = 0; i < coordinates.size(); i++) {
					const ptSeq = this.getCoordinateSequenceFactory().create(1, coordinates.getDimension(), coordinates.getMeasures());
					CoordinateSequences.copy(coordinates, i, ptSeq, 0, 1);
					points[i] = this.createPoint(ptSeq);
				}
				return this.createMultiPoint(points);
			}
		}
	}
	buildGeometry(geomList) {
		let geomType = null;
		let isHeterogeneous = false;
		let hasGeometryCollection = false;
		for (let i = geomList.iterator(); i.hasNext();) {
			const geom = i.next();
			const partType = geom.getTypeCode();
			if (geomType === null) geomType = partType;
			if (partType !== geomType) isHeterogeneous = true;
			if (geom instanceof GeometryCollection) hasGeometryCollection = true;
		}
		if (geomType === null) return this.createGeometryCollection();
		if (isHeterogeneous || hasGeometryCollection) return this.createGeometryCollection(GeometryFactory.toGeometryArray(geomList));
		const geom0 = geomList.iterator().next();
		if (geomList.size() > 1) {
			if (geom0 instanceof Polygon) return this.createMultiPolygon(GeometryFactory.toPolygonArray(geomList));
			else if (geom0 instanceof LineString) return this.createMultiLineString(GeometryFactory.toLineStringArray(geomList));
			else if (geom0 instanceof Point) return this.createMultiPoint(GeometryFactory.toPointArray(geomList));
			Assert.shouldNeverReachHere("Unhandled geometry type: " + geom0.getGeometryType());
		}
		return geom0;
	}
	createMultiPointFromCoords(coordinates) {
		return this.createMultiPoint(coordinates !== null ? this.getCoordinateSequenceFactory().create(coordinates) : null);
	}
	createPoint() {
		if (arguments.length === 0) return this.createPoint(this.getCoordinateSequenceFactory().create([]));
		else if (arguments.length === 1) {
			if (arguments[0] instanceof Coordinate) {
				const coordinate = arguments[0];
				return this.createPoint(coordinate !== null ? this.getCoordinateSequenceFactory().create([coordinate]) : null);
			} else if (hasInterface_default(arguments[0], CoordinateSequence)) {
				const coordinates = arguments[0];
				return new Point(coordinates, this);
			}
		}
	}
	getCoordinateSequenceFactory() {
		return this._coordinateSequenceFactory;
	}
	get interfaces_() {
		return [Serializable];
	}
};
// node_modules/jsts/org/locationtech/jts/io/GeoJSONParser.js
var geometryTypes = [
	"Point",
	"MultiPoint",
	"LineString",
	"MultiLineString",
	"Polygon",
	"MultiPolygon"
];
/**
* Class for reading and writing Well-Known Text.Create a new parser for GeoJSON
* NOTE: Adapted from OpenLayers 2.11 implementation.
*/
/**
* Create a new parser for GeoJSON
*
* @param {GeometryFactory} geometryFactory
* @return An instance of GeoJsonParser.
* @constructor
* @private
*/
var GeoJSONParser = class {
	constructor(geometryFactory) {
		this.geometryFactory = geometryFactory || new GeometryFactory();
	}
	/**
	* Deserialize a GeoJSON object and return the Geometry or Feature(Collection) with JSTS Geometries
	*
	* @param {}
	*          A GeoJSON object.
	* @return {} A Geometry instance or object representing a Feature(Collection) with Geometry instances.
	* @private
	*/
	read(json) {
		let obj;
		if (typeof json === "string") obj = JSON.parse(json);
		else obj = json;
		const type = obj.type;
		if (!parse[type]) throw new Error("Unknown GeoJSON type: " + obj.type);
		if (geometryTypes.indexOf(type) !== -1) return parse[type].call(this, obj.coordinates);
		else if (type === "GeometryCollection") return parse[type].call(this, obj.geometries);
		return parse[type].call(this, obj);
	}
	/**
	* Serialize a Geometry object into GeoJSON
	*
	* @param {Geometry}
	*          geometry A Geometry or array of Geometries.
	* @return {Object} A GeoJSON object represting the input Geometry/Geometries.
	* @private
	*/
	write(geometry) {
		const type = geometry.getGeometryType();
		if (!extract[type]) throw new Error("Geometry is not supported");
		return extract[type].call(this, geometry);
	}
};
var parse = {
	/**
	* Parse a GeoJSON Feature object
	*
	* @param {Object}
	*          obj Object to parse.
	*
	* @return {Object} Feature with geometry/bbox converted to JSTS Geometries.
	*/
	Feature: function(obj) {
		const feature = {};
		for (const key in obj) feature[key] = obj[key];
		if (obj.geometry) {
			if (!parse[obj.geometry.type]) throw new Error("Unknown GeoJSON type: " + obj.type);
			feature.geometry = this.read(obj.geometry);
		}
		if (obj.bbox) feature.bbox = parse.bbox.call(this, obj.bbox);
		return feature;
	},
	/**
	* Parse a GeoJSON FeatureCollection object
	*
	* @param {Object}
	*          obj Object to parse.
	*
	* @return {Object} FeatureCollection with geometry/bbox converted to JSTS Geometries.
	*/
	FeatureCollection: function(obj) {
		const featureCollection = {};
		if (obj.features) {
			featureCollection.features = [];
			for (let i = 0; i < obj.features.length; ++i) featureCollection.features.push(this.read(obj.features[i]));
		}
		if (obj.bbox) featureCollection.bbox = this.parse.bbox.call(this, obj.bbox);
		return featureCollection;
	},
	/**
	* Convert the ordinates in an array to an array of Coordinates
	*
	* @param {Array}
	*          array Array with {Number}s.
	*
	* @return {Array} Array with Coordinates.
	*/
	coordinates: function(array) {
		const coordinates = [];
		for (let i = 0; i < array.length; ++i) {
			const sub = array[i];
			coordinates.push(new Coordinate(...sub));
		}
		return coordinates;
	},
	/**
	* Convert the bbox to a LinearRing
	*
	* @param {Array}
	*          array Array with [xMin, yMin, xMax, yMax].
	*
	* @return {Array} Array with Coordinates.
	*/
	bbox: function(array) {
		return this.geometryFactory.createLinearRing([
			new Coordinate(array[0], array[1]),
			new Coordinate(array[2], array[1]),
			new Coordinate(array[2], array[3]),
			new Coordinate(array[0], array[3]),
			new Coordinate(array[0], array[1])
		]);
	},
	/**
	* Convert an Array with ordinates to a Point
	*
	* @param {Array}
	*          array Array with ordinates.
	*
	* @return {Point} Point.
	*/
	Point: function(array) {
		const coordinate = new Coordinate(...array);
		return this.geometryFactory.createPoint(coordinate);
	},
	/**
	* Convert an Array with coordinates to a MultiPoint
	*
	* @param {Array}
	*          array Array with coordinates.
	*
	* @return {MultiPoint} MultiPoint.
	*/
	MultiPoint: function(array) {
		const points = [];
		for (let i = 0; i < array.length; ++i) points.push(parse.Point.call(this, array[i]));
		return this.geometryFactory.createMultiPoint(points);
	},
	/**
	* Convert an Array with coordinates to a LineString
	*
	* @param {Array}
	*          array Array with coordinates.
	*
	* @return {LineString} LineString.
	*/
	LineString: function(array) {
		const coordinates = parse.coordinates.call(this, array);
		return this.geometryFactory.createLineString(coordinates);
	},
	/**
	* Convert an Array with coordinates to a MultiLineString
	*
	* @param {Array}
	*          array Array with coordinates.
	*
	* @return {MultiLineString} MultiLineString.
	*/
	MultiLineString: function(array) {
		const lineStrings = [];
		for (let i = 0; i < array.length; ++i) lineStrings.push(parse.LineString.call(this, array[i]));
		return this.geometryFactory.createMultiLineString(lineStrings);
	},
	/**
	* Convert an Array to a Polygon
	*
	* @param {Array}
	*          array Array with shell and holes.
	*
	* @return {Polygon} Polygon.
	*/
	Polygon: function(array) {
		const shellCoordinates = parse.coordinates.call(this, array[0]);
		const shell = this.geometryFactory.createLinearRing(shellCoordinates);
		const holes = [];
		for (let i = 1; i < array.length; ++i) {
			const hole = array[i];
			const coordinates = parse.coordinates.call(this, hole);
			const linearRing = this.geometryFactory.createLinearRing(coordinates);
			holes.push(linearRing);
		}
		return this.geometryFactory.createPolygon(shell, holes);
	},
	/**
	* Convert an Array to a MultiPolygon
	*
	* @param {Array}
	*          array Array of arrays with shell and rings.
	*
	* @return {MultiPolygon} MultiPolygon.
	*/
	MultiPolygon: function(array) {
		const polygons = [];
		for (let i = 0; i < array.length; ++i) {
			const polygon = array[i];
			polygons.push(parse.Polygon.call(this, polygon));
		}
		return this.geometryFactory.createMultiPolygon(polygons);
	},
	/**
	* Convert an Array to a GeometryCollection
	*
	* @param {Array}
	*          array Array of GeoJSON geometries.
	*
	* @return {GeometryCollection} GeometryCollection.
	*/
	GeometryCollection: function(array) {
		const geometries = [];
		for (let i = 0; i < array.length; ++i) {
			const geometry = array[i];
			geometries.push(this.read(geometry));
		}
		return this.geometryFactory.createGeometryCollection(geometries);
	}
};
var extract = {
	/**
	* Convert a Coordinate to an Array
	*
	* @param {Coordinate}
	*          coordinate Coordinate to convert.
	*
	* @return {Array} Array of ordinates.
	*/
	coordinate: function(coordinate) {
		const a = [coordinate.x, coordinate.y];
		if (coordinate.z) a.push(coordinate.z);
		if (coordinate.m) a.push(coordinate.m);
		return a;
	},
	/**
	* Convert a Point to a GeoJSON object
	*
	* @param {Point}
	*          point Point to convert.
	*
	* @return {Array} Array of 2 ordinates (paired to a coordinate).
	*/
	Point: function(point) {
		return {
			type: "Point",
			coordinates: extract.coordinate.call(this, point.getCoordinate())
		};
	},
	/**
	* Convert a MultiPoint to a GeoJSON object
	*
	* @param {MultiPoint}
	*          multipoint MultiPoint to convert.
	*
	* @return {Array} Array of coordinates.
	*/
	MultiPoint: function(multipoint) {
		const array = [];
		for (let i = 0; i < multipoint._geometries.length; ++i) {
			const point = multipoint._geometries[i];
			const geoJson = extract.Point.call(this, point);
			array.push(geoJson.coordinates);
		}
		return {
			type: "MultiPoint",
			coordinates: array
		};
	},
	/**
	* Convert a LineString to a GeoJSON object
	*
	* @param {LineString}
	*          linestring LineString to convert.
	*
	* @return {Array} Array of coordinates.
	*/
	LineString: function(linestring) {
		const array = [];
		const coordinates = linestring.getCoordinates();
		for (let i = 0; i < coordinates.length; ++i) {
			const coordinate = coordinates[i];
			array.push(extract.coordinate.call(this, coordinate));
		}
		return {
			type: "LineString",
			coordinates: array
		};
	},
	/**
	* Convert a MultiLineString to a GeoJSON object
	*
	* @param {MultiLineString}
	*          multilinestring MultiLineString to convert.
	*
	* @return {Array} Array of Array of coordinates.
	*/
	MultiLineString: function(multilinestring) {
		const array = [];
		for (let i = 0; i < multilinestring._geometries.length; ++i) {
			const linestring = multilinestring._geometries[i];
			const geoJson = extract.LineString.call(this, linestring);
			array.push(geoJson.coordinates);
		}
		return {
			type: "MultiLineString",
			coordinates: array
		};
	},
	/**
	* Convert a Polygon to a GeoJSON object
	*
	* @param {Polygon}
	*          polygon Polygon to convert.
	*
	* @return {Array} Array with shell, holes.
	*/
	Polygon: function(polygon) {
		const array = [];
		const shellGeoJson = extract.LineString.call(this, polygon._shell);
		array.push(shellGeoJson.coordinates);
		for (let i = 0; i < polygon._holes.length; ++i) {
			const hole = polygon._holes[i];
			const holeGeoJson = extract.LineString.call(this, hole);
			array.push(holeGeoJson.coordinates);
		}
		return {
			type: "Polygon",
			coordinates: array
		};
	},
	/**
	* Convert a MultiPolygon to a GeoJSON object
	*
	* @param {MultiPolygon}
	*          multipolygon MultiPolygon to convert.
	*
	* @return {Array} Array of polygons.
	*/
	MultiPolygon: function(multipolygon) {
		const array = [];
		for (let i = 0; i < multipolygon._geometries.length; ++i) {
			const polygon = multipolygon._geometries[i];
			const geoJson = extract.Polygon.call(this, polygon);
			array.push(geoJson.coordinates);
		}
		return {
			type: "MultiPolygon",
			coordinates: array
		};
	},
	/**
	* Convert a GeometryCollection to a GeoJSON object
	*
	* @param {GeometryCollection}
	*          collection GeometryCollection to convert.
	*
	* @return {Array} Array of geometries.
	*/
	GeometryCollection: function(collection) {
		const array = [];
		for (let i = 0; i < collection._geometries.length; ++i) {
			const geometry = collection._geometries[i];
			const type = geometry.getGeometryType();
			array.push(extract[type].call(this, geometry));
		}
		return {
			type: "GeometryCollection",
			geometries: array
		};
	}
};
// node_modules/jsts/org/locationtech/jts/io/GeoJSONReader.js
/**
* @module org/locationtech/jts/io/GeoJSONReader
*/
/**
* Converts a geometry in GeoJSON to a {@link Geometry}.
*/
var GeoJSONReader = class {
	/**
	* A <code>GeoJSONReader</code> is parameterized by a <code>GeometryFactory</code>,
	* to allow it to create <code>Geometry</code> objects of the appropriate
	* implementation. In particular, the <code>GeometryFactory</code> determines
	* the <code>PrecisionModel</code> and <code>SRID</code> that is used.
	*
	* @param {GeometryFactory} geometryFactory
	*/
	constructor(geometryFactory) {
		this.parser = new GeoJSONParser(geometryFactory || new GeometryFactory());
	}
	/**
	* Reads a GeoJSON representation of a {@link Geometry}
	*
	* Will also parse GeoJSON Features/FeatureCollections as custom objects.
	*
	* @param {Object|String} geoJson a GeoJSON Object or String.
	* @return {Geometry|Object} a <code>Geometry or Feature/FeatureCollection representation.</code>
	* @memberof module:org/locationtech/jts/io/GeoJSONReader#
	*/
	read(geoJson) {
		return this.parser.read(geoJson);
	}
};
// node_modules/jsts/org/locationtech/jts/geom/Location.js
var Location = class Location {
	static toLocationSymbol(locationValue) {
		switch (locationValue) {
			case Location.EXTERIOR: return "e";
			case Location.BOUNDARY: return "b";
			case Location.INTERIOR: return "i";
			case Location.NONE: return "-";
		}
		throw new IllegalArgumentException("Unknown location value: " + locationValue);
	}
};
Location.INTERIOR = 0;
Location.BOUNDARY = 1;
Location.EXTERIOR = 2;
Location.NONE = -1;
// node_modules/jsts/org/locationtech/jts/geomgraph/Position.js
var Position = class Position {
	static opposite(position) {
		if (position === Position.LEFT) return Position.RIGHT;
		if (position === Position.RIGHT) return Position.LEFT;
		return position;
	}
};
Position.ON = 0;
Position.LEFT = 1;
Position.RIGHT = 2;
// node_modules/jsts/org/locationtech/jts/algorithm/Intersection.js
var Intersection = class {
	static intersection(p1, p2, q1, q2) {
		const minX0 = p1.x < p2.x ? p1.x : p2.x;
		const minY0 = p1.y < p2.y ? p1.y : p2.y;
		const maxX0 = p1.x > p2.x ? p1.x : p2.x;
		const maxY0 = p1.y > p2.y ? p1.y : p2.y;
		const minX1 = q1.x < q2.x ? q1.x : q2.x;
		const minY1 = q1.y < q2.y ? q1.y : q2.y;
		const maxX1 = q1.x > q2.x ? q1.x : q2.x;
		const maxY1 = q1.y > q2.y ? q1.y : q2.y;
		const intMinX = minX0 > minX1 ? minX0 : minX1;
		const intMaxX = maxX0 < maxX1 ? maxX0 : maxX1;
		const intMinY = minY0 > minY1 ? minY0 : minY1;
		const intMaxY = maxY0 < maxY1 ? maxY0 : maxY1;
		const midx = (intMinX + intMaxX) / 2;
		const midy = (intMinY + intMaxY) / 2;
		const p1x = p1.x - midx;
		const p1y = p1.y - midy;
		const p2x = p2.x - midx;
		const p2y = p2.y - midy;
		const q1x = q1.x - midx;
		const q1y = q1.y - midy;
		const q2x = q2.x - midx;
		const q2y = q2.y - midy;
		const px = p1y - p2y;
		const py = p2x - p1x;
		const pw = p1x * p2y - p2x * p1y;
		const qx = q1y - q2y;
		const qy = q2x - q1x;
		const qw = q1x * q2y - q2x * q1y;
		const x = py * qw - qy * pw;
		const y = qx * pw - px * qw;
		const w = px * qy - qx * py;
		const xInt = x / w;
		const yInt = y / w;
		if (Double.isNaN(xInt) || Double.isInfinite(xInt) || Double.isNaN(yInt) || Double.isInfinite(yInt)) return null;
		return new Coordinate(xInt + midx, yInt + midy);
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/Distance.js
var Distance = class Distance {
	static pointToSegmentString(p, line) {
		if (line.length === 0) throw new IllegalArgumentException("Line array must contain at least one vertex");
		let minDistance = p.distance(line[0]);
		for (let i = 0; i < line.length - 1; i++) {
			const dist = Distance.pointToSegment(p, line[i], line[i + 1]);
			if (dist < minDistance) minDistance = dist;
		}
		return minDistance;
	}
	static segmentToSegment(A, B, C, D) {
		if (A.equals(B)) return Distance.pointToSegment(A, C, D);
		if (C.equals(D)) return Distance.pointToSegment(D, A, B);
		let noIntersection = false;
		if (!Envelope.intersects(A, B, C, D)) noIntersection = true;
		else {
			const denom = (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x);
			if (denom === 0) noIntersection = true;
			else {
				const r_num = (A.y - C.y) * (D.x - C.x) - (A.x - C.x) * (D.y - C.y);
				const s = ((A.y - C.y) * (B.x - A.x) - (A.x - C.x) * (B.y - A.y)) / denom;
				const r = r_num / denom;
				if (r < 0 || r > 1 || s < 0 || s > 1) noIntersection = true;
			}
		}
		if (noIntersection) return MathUtil.min(Distance.pointToSegment(A, C, D), Distance.pointToSegment(B, C, D), Distance.pointToSegment(C, A, B), Distance.pointToSegment(D, A, B));
		return 0;
	}
	static pointToLinePerpendicular(p, A, B) {
		const len2 = (B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y);
		const s = ((A.y - p.y) * (B.x - A.x) - (A.x - p.x) * (B.y - A.y)) / len2;
		return Math.abs(s) * Math.sqrt(len2);
	}
	static pointToSegment(p, A, B) {
		if (A.x === B.x && A.y === B.y) return p.distance(A);
		const len2 = (B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y);
		const r = ((p.x - A.x) * (B.x - A.x) + (p.y - A.y) * (B.y - A.y)) / len2;
		if (r <= 0) return p.distance(A);
		if (r >= 1) return p.distance(B);
		const s = ((A.y - p.y) * (B.x - A.x) - (A.x - p.x) * (B.y - A.y)) / len2;
		return Math.abs(s) * Math.sqrt(len2);
	}
};
// node_modules/jsts/org/locationtech/jts/io/WKTParser.js
/**
* The coordinate layout for geometries, indicating whether a 3rd or 4th z ('Z')
* or measure ('M') coordinate is available. Supported values are `'XY'`,
* `'XYZ'`, `'XYM'`, `'XYZM'`.
* @enum {string}
*/
var GeometryLayout = {
	XY: "XY",
	XYZ: "XYZ",
	XYM: "XYM",
	XYZM: "XYZM"
};
/**
* The geometry type. One of `'Point'`, `'LineString'`, `'LinearRing'`,
* `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
* `'GeometryCollection'`, `'Circle'`.
* @enum {string}
*/
var GeometryType = {
	POINT: "Point",
	LINE_STRING: "LineString",
	LINEAR_RING: "LinearRing",
	POLYGON: "Polygon",
	MULTI_POINT: "MultiPoint",
	MULTI_LINE_STRING: "MultiLineString",
	MULTI_POLYGON: "MultiPolygon",
	GEOMETRY_COLLECTION: "GeometryCollection",
	CIRCLE: "Circle"
};
/**
* @typedef {Object} Options
* @property {boolean} [splitCollection=false] Whether to split GeometryCollections into
* multiple features on reading.
*/
/**
* @typedef {Object} Token
* @property {number} type
* @property {number|string} [value]
* @property {number} position
*/
/**
* @const
* @type {string}
*/
var EMPTY = "EMPTY";
/**
* @const
* @type {string}
*/
var Z = "Z";
/**
* @const
* @type {string}
*/
var M = "M";
/**
* @const
* @type {string}
*/
var ZM = "ZM";
/**
* @const
* @enum {number}
*/
var TokenType = {
	TEXT: 1,
	LEFT_PAREN: 2,
	RIGHT_PAREN: 3,
	NUMBER: 4,
	COMMA: 5,
	EOF: 6
};
/**
* @const
* @type {Object<string, string>}
*/
var WKTGeometryType = {};
for (const type in GeometryType) WKTGeometryType[type] = GeometryType[type].toUpperCase();
/**
* Class to tokenize a WKT string.
*/
var Lexer = class {
	/**
	* @param {string} wkt WKT string.
	*/
	constructor(wkt) {
		/**
		* @type {string}
		*/
		this.wkt = wkt;
		/**
		* @type {number}
		* @private
		*/
		this.index_ = -1;
	}
	/**
	* @param {string} c Character.
	* @return {boolean} Whether the character is alphabetic.
	* @private
	*/
	isAlpha_(c) {
		return c >= "a" && c <= "z" || c >= "A" && c <= "Z";
	}
	/**
	* @param {string} c Character.
	* @param {boolean=} opt_decimal Whether the string number
	*     contains a dot, i.e. is a decimal number.
	* @return {boolean} Whether the character is numeric.
	* @private
	*/
	isNumeric_(c, opt_decimal) {
		return c >= "0" && c <= "9" || c == "." && !(opt_decimal !== void 0 ? opt_decimal : false);
	}
	/**
	* @param {string} c Character.
	* @return {boolean} Whether the character is whitespace.
	* @private
	*/
	isWhiteSpace_(c) {
		return c == " " || c == "	" || c == "\r" || c == "\n";
	}
	/**
	* @return {string} Next string character.
	* @private
	*/
	nextChar_() {
		return this.wkt.charAt(++this.index_);
	}
	/**
	* Fetch and return the next token.
	* @return {!Token} Next string token.
	*/
	nextToken() {
		const c = this.nextChar_();
		const position = this.index_;
		/** @type {number|string} */
		let value = c;
		let type;
		if (c == "(") type = TokenType.LEFT_PAREN;
		else if (c == ",") type = TokenType.COMMA;
		else if (c == ")") type = TokenType.RIGHT_PAREN;
		else if (this.isNumeric_(c) || c == "-") {
			type = TokenType.NUMBER;
			value = this.readNumber_();
		} else if (this.isAlpha_(c)) {
			type = TokenType.TEXT;
			value = this.readText_();
		} else if (this.isWhiteSpace_(c)) return this.nextToken();
		else if (c === "") type = TokenType.EOF;
		else throw new Error("Unexpected character: " + c);
		return {
			position,
			value,
			type
		};
	}
	/**
	* @return {number} Numeric token value.
	* @private
	*/
	readNumber_() {
		let c;
		const index = this.index_;
		let decimal = false;
		let scientificNotation = false;
		do {
			if (c == ".") decimal = true;
			else if (c == "e" || c == "E") scientificNotation = true;
			c = this.nextChar_();
		} while (this.isNumeric_(c, decimal) || !scientificNotation && (c == "e" || c == "E") || scientificNotation && (c == "-" || c == "+"));
		return parseFloat(this.wkt.substring(index, this.index_--));
	}
	/**
	* @return {string} String token value.
	* @private
	*/
	readText_() {
		let c;
		const index = this.index_;
		do
			c = this.nextChar_();
		while (this.isAlpha_(c));
		return this.wkt.substring(index, this.index_--).toUpperCase();
	}
};
/**
* Class to parse the tokens from the WKT string.
*/
var Parser = class {
	/**
	* @param {Lexer} lexer The lexer.
	*/
	constructor(lexer, factory) {
		/**
		* @type {Lexer}
		* @private
		*/
		this.lexer_ = lexer;
		/**
		* @type {Token}
		* @private
		*/
		this.token_;
		/**
		* @type {import("../geom/GeometryLayout.js").default}
		* @private
		*/
		this.layout_ = GeometryLayout.XY;
		this.factory = factory;
	}
	/**
	* Fetch the next token form the lexer and replace the active token.
	* @private
	*/
	consume_() {
		this.token_ = this.lexer_.nextToken();
	}
	/**
	* Tests if the given type matches the type of the current token.
	* @param {TokenType} type Token type.
	* @return {boolean} Whether the token matches the given type.
	*/
	isTokenType(type) {
		return this.token_.type == type;
	}
	/**
	* If the given type matches the current token, consume it.
	* @param {TokenType} type Token type.
	* @return {boolean} Whether the token matches the given type.
	*/
	match(type) {
		const isMatch = this.isTokenType(type);
		if (isMatch) this.consume_();
		return isMatch;
	}
	/**
	* Try to parse the tokens provided by the lexer.
	* @return {import("../geom/Geometry.js").default} The geometry.
	*/
	parse() {
		this.consume_();
		return this.parseGeometry_();
	}
	/**
	* Try to parse the dimensional info.
	* @return {import("../geom/GeometryLayout.js").default} The layout.
	* @private
	*/
	parseGeometryLayout_() {
		let layout = GeometryLayout.XY;
		const dimToken = this.token_;
		if (this.isTokenType(TokenType.TEXT)) {
			const dimInfo = dimToken.value;
			if (dimInfo === Z) layout = GeometryLayout.XYZ;
			else if (dimInfo === M) layout = GeometryLayout.XYM;
			else if (dimInfo === ZM) layout = GeometryLayout.XYZM;
			if (layout !== GeometryLayout.XY) this.consume_();
		}
		return layout;
	}
	/**
	* @return {!Array<import("../geom/Geometry.js").default>} A collection of geometries.
	* @private
	*/
	parseGeometryCollectionText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const geometries = [];
			do
				geometries.push(this.parseGeometry_());
			while (this.match(TokenType.COMMA));
			if (this.match(TokenType.RIGHT_PAREN)) return geometries;
		} else if (this.isEmptyGeometry_()) return [];
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {Array<number>} All values in a point.
	* @private
	*/
	parsePointText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const coordinates = this.parsePoint_();
			if (this.match(TokenType.RIGHT_PAREN)) return coordinates;
		} else if (this.isEmptyGeometry_()) return null;
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<!Array<number>>} All points in a linestring.
	* @private
	*/
	parseLineStringText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const coordinates = this.parsePointList_();
			if (this.match(TokenType.RIGHT_PAREN)) return coordinates;
		} else if (this.isEmptyGeometry_()) return [];
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<!Array<!Array<number>>>} All points in a polygon.
	* @private
	*/
	parsePolygonText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const coordinates = this.parseLineStringTextList_();
			if (this.match(TokenType.RIGHT_PAREN)) return coordinates;
		} else if (this.isEmptyGeometry_()) return [];
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<!Array<number>>} All points in a multipoint.
	* @private
	*/
	parseMultiPointText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			let coordinates;
			if (this.token_.type == TokenType.LEFT_PAREN) coordinates = this.parsePointTextList_();
			else coordinates = this.parsePointList_();
			if (this.match(TokenType.RIGHT_PAREN)) return coordinates;
		} else if (this.isEmptyGeometry_()) return [];
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<!Array<!Array<number>>>} All linestring points
	*                                          in a multilinestring.
	* @private
	*/
	parseMultiLineStringText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const coordinates = this.parseLineStringTextList_();
			if (this.match(TokenType.RIGHT_PAREN)) return coordinates;
		} else if (this.isEmptyGeometry_()) return [];
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<!Array<!Array<!Array<number>>>>} All polygon points in a multipolygon.
	* @private
	*/
	parseMultiPolygonText_() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const coordinates = this.parsePolygonTextList_();
			if (this.match(TokenType.RIGHT_PAREN)) return coordinates;
		} else if (this.isEmptyGeometry_()) return [];
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<number>} A point.
	* @private
	*/
	parsePoint_() {
		const coordinates = [];
		const dimensions = this.layout_.length;
		for (let i = 0; i < dimensions; ++i) {
			const token = this.token_;
			if (this.match(TokenType.NUMBER)) coordinates.push(token.value);
			else break;
		}
		if (coordinates.length == dimensions) return coordinates;
		throw new Error(this.formatErrorMessage_());
	}
	/**
	* @return {!Array<!Array<number>>} An array of points.
	* @private
	*/
	parsePointList_() {
		const coordinates = [this.parsePoint_()];
		while (this.match(TokenType.COMMA)) coordinates.push(this.parsePoint_());
		return coordinates;
	}
	/**
	* @return {!Array<!Array<number>>} An array of points.
	* @private
	*/
	parsePointTextList_() {
		const coordinates = [this.parsePointText_()];
		while (this.match(TokenType.COMMA)) coordinates.push(this.parsePointText_());
		return coordinates;
	}
	/**
	* @return {!Array<!Array<!Array<number>>>} An array of points.
	* @private
	*/
	parseLineStringTextList_() {
		const coordinates = [this.parseLineStringText_()];
		while (this.match(TokenType.COMMA)) coordinates.push(this.parseLineStringText_());
		return coordinates;
	}
	/**
	* @return {!Array<!Array<!Array<!Array<number>>>>} An array of points.
	* @private
	*/
	parsePolygonTextList_() {
		const coordinates = [this.parsePolygonText_()];
		while (this.match(TokenType.COMMA)) coordinates.push(this.parsePolygonText_());
		return coordinates;
	}
	/**
	* @return {boolean} Whether the token implies an empty geometry.
	* @private
	*/
	isEmptyGeometry_() {
		const isEmpty = this.isTokenType(TokenType.TEXT) && this.token_.value == EMPTY;
		if (isEmpty) this.consume_();
		return isEmpty;
	}
	/**
	* Create an error message for an unexpected token error.
	* @return {string} Error message.
	* @private
	*/
	formatErrorMessage_() {
		return "Unexpected `" + this.token_.value + "` at position " + this.token_.position + " in `" + this.lexer_.wkt + "`";
	}
	/**
	* @return {!import("../geom/Geometry.js").default} The geometry.
	* @private
	*/
	parseGeometry_() {
		const factory = this.factory;
		const o2c = (ordinates) => ordinates ? new Coordinate(...ordinates) : new Coordinate();
		const ca2p = (coordinates) => {
			const rings = coordinates.map((a) => factory.createLinearRing(a.map(o2c)));
			if (rings.length > 1) return factory.createPolygon(rings[0], rings.slice(1));
			else if (rings.length === 1) return factory.createPolygon(rings[0]);
			else return factory.createPolygon();
		};
		const token = this.token_;
		if (this.match(TokenType.TEXT)) {
			const geomType = token.value;
			this.layout_ = this.parseGeometryLayout_();
			if (geomType == "GEOMETRYCOLLECTION") {
				const geometries = this.parseGeometryCollectionText_();
				return factory.createGeometryCollection(geometries);
			} else switch (geomType) {
				case "POINT": {
					const ordinates = this.parsePointText_();
					if (!ordinates) return factory.createPoint();
					return factory.createPoint(new Coordinate(...ordinates));
				}
				case "LINESTRING": {
					const components = this.parseLineStringText_().map(o2c);
					return factory.createLineString(components);
				}
				case "LINEARRING": {
					const components = this.parseLineStringText_().map(o2c);
					return factory.createLinearRing(components);
				}
				case "POLYGON": {
					const coordinates = this.parsePolygonText_();
					if (!coordinates || coordinates.length === 0) return factory.createPolygon();
					return ca2p(coordinates);
				}
				case "MULTIPOINT": {
					const coordinates = this.parseMultiPointText_();
					if (!coordinates || coordinates.length === 0) return factory.createMultiPoint();
					const components = coordinates.map(o2c).map((c) => factory.createPoint(c));
					return factory.createMultiPoint(components);
				}
				case "MULTILINESTRING": {
					const components = this.parseMultiLineStringText_().map((a) => factory.createLineString(a.map(o2c)));
					return factory.createMultiLineString(components);
				}
				case "MULTIPOLYGON": {
					const coordinates = this.parseMultiPolygonText_();
					if (!coordinates || coordinates.length === 0) return factory.createMultiPolygon();
					const polygons = coordinates.map(ca2p);
					return factory.createMultiPolygon(polygons);
				}
				default: throw new Error("Invalid geometry type: " + geomType);
			}
		}
		throw new Error(this.formatErrorMessage_());
	}
};
/**
* @param {Point} geom Point geometry.
* @return {string} Coordinates part of Point as WKT.
*/
function encodePointGeometry(geom) {
	if (geom.isEmpty()) return "";
	const c = geom.getCoordinate();
	const cs = [c.x, c.y];
	if (c.z !== void 0 && !Number.isNaN(c.z)) cs.push(c.z);
	if (c.m !== void 0 && !Number.isNaN(c.m)) cs.push(c.m);
	return cs.join(" ");
}
/**
* @param {MultiPoint} geom MultiPoint geometry.
* @return {string} Coordinates part of MultiPoint as WKT.
*/
function encodeMultiPointGeometry(geom) {
	const array = [];
	for (let i = 0, ii = geom.getNumGeometries(); i < ii; ++i) array.push("(" + encodePointGeometry(geom.getGeometryN(i)) + ")");
	return array.join(", ");
}
/**
* @param {GeometryCollection} geom GeometryCollection geometry.
* @return {string} Coordinates part of GeometryCollection as WKT.
*/
function encodeGeometryCollectionGeometry(geom) {
	const array = [];
	for (let i = 0, ii = geom.getNumGeometries(); i < ii; ++i) array.push(encode(geom.getGeometryN(i)));
	return array.join(", ");
}
/**
* @param {LineString|import("../geom/LinearRing.js").default} geom LineString geometry.
* @return {string} Coordinates part of LineString as WKT.
*/
function encodeLineStringGeometry(geom) {
	const coordinates = geom.getCoordinates().map((c) => {
		const a = [c.x, c.y];
		if (c.z !== void 0 && !Number.isNaN(c.z)) a.push(c.z);
		if (c.m !== void 0 && !Number.isNaN(c.m)) a.push(c.m);
		return a;
	});
	const array = [];
	for (let i = 0, ii = coordinates.length; i < ii; ++i) array.push(coordinates[i].join(" "));
	return array.join(", ");
}
/**
* @param {MultiLineString} geom MultiLineString geometry.
* @return {string} Coordinates part of MultiLineString as WKT.
*/
function encodeMultiLineStringGeometry(geom) {
	const array = [];
	for (let i = 0, ii = geom.getNumGeometries(); i < ii; ++i) array.push("(" + encodeLineStringGeometry(geom.getGeometryN(i)) + ")");
	return array.join(", ");
}
/**
* @param {Polygon} geom Polygon geometry.
* @return {string} Coordinates part of Polygon as WKT.
*/
function encodePolygonGeometry(geom) {
	const array = [];
	array.push("(" + encodeLineStringGeometry(geom.getExteriorRing()) + ")");
	for (let i = 0, ii = geom.getNumInteriorRing(); i < ii; ++i) array.push("(" + encodeLineStringGeometry(geom.getInteriorRingN(i)) + ")");
	return array.join(", ");
}
/**
* @param {MultiPolygon} geom MultiPolygon geometry.
* @return {string} Coordinates part of MultiPolygon as WKT.
*/
function encodeMultiPolygonGeometry(geom) {
	const array = [];
	for (let i = 0, ii = geom.getNumGeometries(); i < ii; ++i) array.push("(" + encodePolygonGeometry(geom.getGeometryN(i)) + ")");
	return array.join(", ");
}
/**
* @param {Geometry} geom Geometry geometry.
* @return {string} Potential dimensional information for WKT type.
*/
function encodeGeometryLayout(geom) {
	let dimInfo = "";
	if (geom.isEmpty()) return dimInfo;
	const c = geom.getCoordinate();
	if (c.z !== void 0 && !Number.isNaN(c.z)) dimInfo += Z;
	if (c.m !== void 0 && !Number.isNaN(c.m)) dimInfo += M;
	return dimInfo;
}
/**
* @const
* @type {Object<string, function(import("../geom/Geometry.js").default): string>}
*/
var GeometryEncoder = {
	"Point": encodePointGeometry,
	"LineString": encodeLineStringGeometry,
	"LinearRing": encodeLineStringGeometry,
	"Polygon": encodePolygonGeometry,
	"MultiPoint": encodeMultiPointGeometry,
	"MultiLineString": encodeMultiLineStringGeometry,
	"MultiPolygon": encodeMultiPolygonGeometry,
	"GeometryCollection": encodeGeometryCollectionGeometry
};
/**
* Encode a geometry as WKT.
* @param {!import("../geom/Geometry.js").default} geom The geometry to encode.
* @return {string} WKT string for the geometry.
*/
function encode(geom) {
	let type = geom.getGeometryType();
	const geometryEncoder = GeometryEncoder[type];
	type = type.toUpperCase();
	const dimInfo = encodeGeometryLayout(geom);
	if (dimInfo.length > 0) type += " " + dimInfo;
	if (geom.isEmpty()) return type + " EMPTY";
	const enc = geometryEncoder(geom);
	return type + " (" + enc + ")";
}
/**
* Class for reading and writing Well-Known Text.
*
* NOTE: Adapted from OpenLayers.
*/
var WKTParser = class {
	/** Create a new parser for WKT
	*
	* @param {GeometryFactory} geometryFactory
	* @return An instance of WKTParser.
	* @private
	*/
	constructor(geometryFactory) {
		this.geometryFactory = geometryFactory || new GeometryFactory();
		this.precisionModel = this.geometryFactory.getPrecisionModel();
	}
	/**
	* Deserialize a WKT string and return a geometry. Supports WKT for POINT,
	* MULTIPOINT, LINESTRING, LINEARRING, MULTILINESTRING, POLYGON, MULTIPOLYGON,
	* and GEOMETRYCOLLECTION.
	*
	* @param {String} wkt A WKT string.
	* @return {Geometry} A geometry instance.
	* @private
	*/
	read(wkt) {
		return new Parser(new Lexer(wkt), this.geometryFactory).parse();
	}
	/**
	* Serialize a geometry into a WKT string.
	*
	* @param {Geometry} geometry A feature or array of features.
	* @return {String} The WKT string representation of the input geometries.
	* @private
	*/
	write(geometry) {
		return encode(geometry);
	}
};
// node_modules/jsts/org/locationtech/jts/io/WKTWriter.js
/**
* @module org/locationtech/jts/io/WKTWriter
*/
/**
* Writes the Well-Known Text representation of a {@link Geometry}. The
* Well-Known Text format is defined in the <A
* HREF="http://www.opengis.org/techno/specs.htm"> OGC Simple Features
* Specification for SQL</A>.
* <p>
* The <code>WKTWriter</code> outputs coordinates rounded to the precision
* model. Only the maximum number of decimal places necessary to represent the
* ordinates to the required precision will be output.
* <p>
* The SFS WKT spec does not define a special tag for {@link LinearRing}s.
* Under the spec, rings are output as <code>LINESTRING</code>s.
*/
var WKTWriter = class {
	/**
	* @param {GeometryFactory} geometryFactory
	*/
	constructor(geometryFactory) {
		this.parser = new WKTParser(geometryFactory);
	}
	/**
	* Converts a <code>Geometry</code> to its Well-known Text representation.
	*
	* @param {Geometry} geometry a <code>Geometry</code> to process.
	* @return {string} a <Geometry Tagged Text> string (see the OpenGIS Simple
	*         Features Specification).
	* @memberof module:org/locationtech/jts/io/WKTWriter#
	*/
	write(geometry) {
		return this.parser.write(geometry);
	}
	/**
	* Generates the WKT for a <tt>LINESTRING</tt> specified by two
	* {@link Coordinate}s.
	*
	* @param p0 the first coordinate.
	* @param p1 the second coordinate.
	*
	* @return the WKT.
	* @private
	*/
	static toLineString(p0, p1) {
		if (arguments.length !== 2) throw new Error("Not implemented");
		return "LINESTRING ( " + p0.x + " " + p0.y + ", " + p1.x + " " + p1.y + " )";
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/LineIntersector.js
var LineIntersector = class LineIntersector {
	constructor() {
		LineIntersector.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._result = null;
		this._inputLines = Array(2).fill().map(() => Array(2));
		this._intPt = new Array(2).fill(null);
		this._intLineIndex = null;
		this._isProper = null;
		this._pa = null;
		this._pb = null;
		this._precisionModel = null;
		this._intPt[0] = new Coordinate();
		this._intPt[1] = new Coordinate();
		this._pa = this._intPt[0];
		this._pb = this._intPt[1];
		this._result = 0;
	}
	static nonRobustComputeEdgeDistance(p, p1, p2) {
		const dx = p.x - p1.x;
		const dy = p.y - p1.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		Assert.isTrue(!(dist === 0 && !p.equals(p1)), "Invalid distance calculation");
		return dist;
	}
	static computeEdgeDistance(p, p0, p1) {
		const dx = Math.abs(p1.x - p0.x);
		const dy = Math.abs(p1.y - p0.y);
		let dist = -1;
		if (p.equals(p0)) dist = 0;
		else if (p.equals(p1)) {
			if (dx > dy) dist = dx;
			else dist = dy;
		} else {
			const pdx = Math.abs(p.x - p0.x);
			const pdy = Math.abs(p.y - p0.y);
			if (dx > dy) dist = pdx;
			else dist = pdy;
			if (dist === 0 && !p.equals(p0)) dist = Math.max(pdx, pdy);
		}
		Assert.isTrue(!(dist === 0 && !p.equals(p0)), "Bad distance calculation");
		return dist;
	}
	computeIntersection(p1, p2, p3, p4) {
		this._inputLines[0][0] = p1;
		this._inputLines[0][1] = p2;
		this._inputLines[1][0] = p3;
		this._inputLines[1][1] = p4;
		this._result = this.computeIntersect(p1, p2, p3, p4);
	}
	getIntersectionNum() {
		return this._result;
	}
	computeIntLineIndex() {
		if (arguments.length === 0) {
			if (this._intLineIndex === null) {
				this._intLineIndex = Array(2).fill().map(() => Array(2));
				this.computeIntLineIndex(0);
				this.computeIntLineIndex(1);
			}
		} else if (arguments.length === 1) {
			const segmentIndex = arguments[0];
			if (this.getEdgeDistance(segmentIndex, 0) > this.getEdgeDistance(segmentIndex, 1)) {
				this._intLineIndex[segmentIndex][0] = 0;
				this._intLineIndex[segmentIndex][1] = 1;
			} else {
				this._intLineIndex[segmentIndex][0] = 1;
				this._intLineIndex[segmentIndex][1] = 0;
			}
		}
	}
	isInteriorIntersection() {
		if (arguments.length === 0) {
			if (this.isInteriorIntersection(0)) return true;
			if (this.isInteriorIntersection(1)) return true;
			return false;
		} else if (arguments.length === 1) {
			const inputLineIndex = arguments[0];
			for (let i = 0; i < this._result; i++) if (!(this._intPt[i].equals2D(this._inputLines[inputLineIndex][0]) || this._intPt[i].equals2D(this._inputLines[inputLineIndex][1]))) return true;
			return false;
		}
	}
	getIntersection(intIndex) {
		return this._intPt[intIndex];
	}
	getEdgeDistance(segmentIndex, intIndex) {
		return LineIntersector.computeEdgeDistance(this._intPt[intIndex], this._inputLines[segmentIndex][0], this._inputLines[segmentIndex][1]);
	}
	isCollinear() {
		return this._result === LineIntersector.COLLINEAR_INTERSECTION;
	}
	toString() {
		return WKTWriter.toLineString(this._inputLines[0][0], this._inputLines[0][1]) + " - " + WKTWriter.toLineString(this._inputLines[1][0], this._inputLines[1][1]) + this.getTopologySummary();
	}
	getEndpoint(segmentIndex, ptIndex) {
		return this._inputLines[segmentIndex][ptIndex];
	}
	getIndexAlongSegment(segmentIndex, intIndex) {
		this.computeIntLineIndex();
		return this._intLineIndex[segmentIndex][intIndex];
	}
	getTopologySummary() {
		const catBuilder = new StringBuilder();
		if (this.isEndPoint()) catBuilder.append(" endpoint");
		if (this._isProper) catBuilder.append(" proper");
		if (this.isCollinear()) catBuilder.append(" collinear");
		return catBuilder.toString();
	}
	isProper() {
		return this.hasIntersection() && this._isProper;
	}
	setPrecisionModel(precisionModel) {
		this._precisionModel = precisionModel;
	}
	isEndPoint() {
		return this.hasIntersection() && !this._isProper;
	}
	hasIntersection() {
		return this._result !== LineIntersector.NO_INTERSECTION;
	}
	isIntersection(pt) {
		for (let i = 0; i < this._result; i++) if (this._intPt[i].equals2D(pt)) return true;
		return false;
	}
	getIntersectionAlongSegment(segmentIndex, intIndex) {
		this.computeIntLineIndex();
		return this._intPt[this._intLineIndex[segmentIndex][intIndex]];
	}
};
LineIntersector.DONT_INTERSECT = 0;
LineIntersector.DO_INTERSECT = 1;
LineIntersector.COLLINEAR = 2;
LineIntersector.NO_INTERSECTION = 0;
LineIntersector.POINT_INTERSECTION = 1;
LineIntersector.COLLINEAR_INTERSECTION = 2;
// node_modules/jsts/org/locationtech/jts/algorithm/RobustLineIntersector.js
var RobustLineIntersector = class RobustLineIntersector extends LineIntersector {
	constructor() {
		super();
	}
	static nearestEndpoint(p1, p2, q1, q2) {
		let nearestPt = p1;
		let minDist = Distance.pointToSegment(p1, q1, q2);
		let dist = Distance.pointToSegment(p2, q1, q2);
		if (dist < minDist) {
			minDist = dist;
			nearestPt = p2;
		}
		dist = Distance.pointToSegment(q1, p1, p2);
		if (dist < minDist) {
			minDist = dist;
			nearestPt = q1;
		}
		dist = Distance.pointToSegment(q2, p1, p2);
		if (dist < minDist) {
			minDist = dist;
			nearestPt = q2;
		}
		return nearestPt;
	}
	isInSegmentEnvelopes(intPt) {
		const env0 = new Envelope(this._inputLines[0][0], this._inputLines[0][1]);
		const env1 = new Envelope(this._inputLines[1][0], this._inputLines[1][1]);
		return env0.contains(intPt) && env1.contains(intPt);
	}
	computeIntersection() {
		if (arguments.length === 3) {
			const p = arguments[0], p1 = arguments[1], p2 = arguments[2];
			this._isProper = false;
			if (Envelope.intersects(p1, p2, p)) {
				if (Orientation.index(p1, p2, p) === 0 && Orientation.index(p2, p1, p) === 0) {
					this._isProper = true;
					if (p.equals(p1) || p.equals(p2)) this._isProper = false;
					this._result = LineIntersector.POINT_INTERSECTION;
					return null;
				}
			}
			this._result = LineIntersector.NO_INTERSECTION;
		} else return super.computeIntersection.apply(this, arguments);
	}
	intersection(p1, p2, q1, q2) {
		let intPt = this.intersectionSafe(p1, p2, q1, q2);
		if (!this.isInSegmentEnvelopes(intPt)) intPt = new Coordinate(RobustLineIntersector.nearestEndpoint(p1, p2, q1, q2));
		if (this._precisionModel !== null) this._precisionModel.makePrecise(intPt);
		return intPt;
	}
	checkDD(p1, p2, q1, q2, intPt) {
		const intPtDD = CGAlgorithmsDD.intersection(p1, p2, q1, q2);
		const isIn = this.isInSegmentEnvelopes(intPtDD);
		System.out.println("DD in env = " + isIn + "  --------------------- " + intPtDD);
		if (intPt.distance(intPtDD) > 1e-4) System.out.println("Distance = " + intPt.distance(intPtDD));
	}
	intersectionSafe(p1, p2, q1, q2) {
		let intPt = Intersection.intersection(p1, p2, q1, q2);
		if (intPt === null) intPt = RobustLineIntersector.nearestEndpoint(p1, p2, q1, q2);
		return intPt;
	}
	computeCollinearIntersection(p1, p2, q1, q2) {
		const p1q1p2 = Envelope.intersects(p1, p2, q1);
		const p1q2p2 = Envelope.intersects(p1, p2, q2);
		const q1p1q2 = Envelope.intersects(q1, q2, p1);
		const q1p2q2 = Envelope.intersects(q1, q2, p2);
		if (p1q1p2 && p1q2p2) {
			this._intPt[0] = q1;
			this._intPt[1] = q2;
			return LineIntersector.COLLINEAR_INTERSECTION;
		}
		if (q1p1q2 && q1p2q2) {
			this._intPt[0] = p1;
			this._intPt[1] = p2;
			return LineIntersector.COLLINEAR_INTERSECTION;
		}
		if (p1q1p2 && q1p1q2) {
			this._intPt[0] = q1;
			this._intPt[1] = p1;
			return q1.equals(p1) && !p1q2p2 && !q1p2q2 ? LineIntersector.POINT_INTERSECTION : LineIntersector.COLLINEAR_INTERSECTION;
		}
		if (p1q1p2 && q1p2q2) {
			this._intPt[0] = q1;
			this._intPt[1] = p2;
			return q1.equals(p2) && !p1q2p2 && !q1p1q2 ? LineIntersector.POINT_INTERSECTION : LineIntersector.COLLINEAR_INTERSECTION;
		}
		if (p1q2p2 && q1p1q2) {
			this._intPt[0] = q2;
			this._intPt[1] = p1;
			return q2.equals(p1) && !p1q1p2 && !q1p2q2 ? LineIntersector.POINT_INTERSECTION : LineIntersector.COLLINEAR_INTERSECTION;
		}
		if (p1q2p2 && q1p2q2) {
			this._intPt[0] = q2;
			this._intPt[1] = p2;
			return q2.equals(p2) && !p1q1p2 && !q1p1q2 ? LineIntersector.POINT_INTERSECTION : LineIntersector.COLLINEAR_INTERSECTION;
		}
		return LineIntersector.NO_INTERSECTION;
	}
	computeIntersect(p1, p2, q1, q2) {
		this._isProper = false;
		if (!Envelope.intersects(p1, p2, q1, q2)) return LineIntersector.NO_INTERSECTION;
		const Pq1 = Orientation.index(p1, p2, q1);
		const Pq2 = Orientation.index(p1, p2, q2);
		if (Pq1 > 0 && Pq2 > 0 || Pq1 < 0 && Pq2 < 0) return LineIntersector.NO_INTERSECTION;
		const Qp1 = Orientation.index(q1, q2, p1);
		const Qp2 = Orientation.index(q1, q2, p2);
		if (Qp1 > 0 && Qp2 > 0 || Qp1 < 0 && Qp2 < 0) return LineIntersector.NO_INTERSECTION;
		if (Pq1 === 0 && Pq2 === 0 && Qp1 === 0 && Qp2 === 0) return this.computeCollinearIntersection(p1, p2, q1, q2);
		if (Pq1 === 0 || Pq2 === 0 || Qp1 === 0 || Qp2 === 0) {
			this._isProper = false;
			if (p1.equals2D(q1) || p1.equals2D(q2)) this._intPt[0] = p1;
			else if (p2.equals2D(q1) || p2.equals2D(q2)) this._intPt[0] = p2;
			else if (Pq1 === 0) this._intPt[0] = new Coordinate(q1);
			else if (Pq2 === 0) this._intPt[0] = new Coordinate(q2);
			else if (Qp1 === 0) this._intPt[0] = new Coordinate(p1);
			else if (Qp2 === 0) this._intPt[0] = new Coordinate(p2);
		} else {
			this._isProper = true;
			this._intPt[0] = this.intersection(p1, p2, q1, q2);
		}
		return LineIntersector.POINT_INTERSECTION;
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/RayCrossingCounter.js
var RayCrossingCounter = class RayCrossingCounter {
	constructor() {
		RayCrossingCounter.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._p = null;
		this._crossingCount = 0;
		this._isPointOnSegment = false;
		const p = arguments[0];
		this._p = p;
	}
	static locatePointInRing() {
		if (arguments[0] instanceof Coordinate && hasInterface_default(arguments[1], CoordinateSequence)) {
			const p = arguments[0], ring = arguments[1];
			const counter = new RayCrossingCounter(p);
			const p1 = new Coordinate();
			const p2 = new Coordinate();
			for (let i = 1; i < ring.size(); i++) {
				ring.getCoordinate(i, p1);
				ring.getCoordinate(i - 1, p2);
				counter.countSegment(p1, p2);
				if (counter.isOnSegment()) return counter.getLocation();
			}
			return counter.getLocation();
		} else if (arguments[0] instanceof Coordinate && arguments[1] instanceof Array) {
			const p = arguments[0], ring = arguments[1];
			const counter = new RayCrossingCounter(p);
			for (let i = 1; i < ring.length; i++) {
				const p1 = ring[i];
				const p2 = ring[i - 1];
				counter.countSegment(p1, p2);
				if (counter.isOnSegment()) return counter.getLocation();
			}
			return counter.getLocation();
		}
	}
	getLocation() {
		if (this._isPointOnSegment) return Location.BOUNDARY;
		if (this._crossingCount % 2 === 1) return Location.INTERIOR;
		return Location.EXTERIOR;
	}
	isPointInPolygon() {
		return this.getLocation() !== Location.EXTERIOR;
	}
	isOnSegment() {
		return this._isPointOnSegment;
	}
	countSegment(p1, p2) {
		if (p1.x < this._p.x && p2.x < this._p.x) return null;
		if (this._p.x === p2.x && this._p.y === p2.y) {
			this._isPointOnSegment = true;
			return null;
		}
		if (p1.y === this._p.y && p2.y === this._p.y) {
			let minx = p1.x;
			let maxx = p2.x;
			if (minx > maxx) {
				minx = p2.x;
				maxx = p1.x;
			}
			if (this._p.x >= minx && this._p.x <= maxx) this._isPointOnSegment = true;
			return null;
		}
		if (p1.y > this._p.y && p2.y <= this._p.y || p2.y > this._p.y && p1.y <= this._p.y) {
			let orient = Orientation.index(p1, p2, this._p);
			if (orient === Orientation.COLLINEAR) {
				this._isPointOnSegment = true;
				return null;
			}
			if (p2.y < p1.y) orient = -orient;
			if (orient === Orientation.LEFT) this._crossingCount++;
		}
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/PointLocation.js
var PointLocation = class PointLocation {
	static isInRing(p, ring) {
		return PointLocation.locateInRing(p, ring) !== Location.EXTERIOR;
	}
	static locateInRing(p, ring) {
		return RayCrossingCounter.locatePointInRing(p, ring);
	}
	static isOnLine() {
		if (arguments[0] instanceof Coordinate && hasInterface_default(arguments[1], CoordinateSequence)) {
			const p = arguments[0], line = arguments[1];
			const lineIntersector = new RobustLineIntersector();
			const p0 = new Coordinate();
			const p1 = new Coordinate();
			const n = line.size();
			for (let i = 1; i < n; i++) {
				line.getCoordinate(i - 1, p0);
				line.getCoordinate(i, p1);
				lineIntersector.computeIntersection(p, p0, p1);
				if (lineIntersector.hasIntersection()) return true;
			}
			return false;
		} else if (arguments[0] instanceof Coordinate && arguments[1] instanceof Array) {
			const p = arguments[0], line = arguments[1];
			const lineIntersector = new RobustLineIntersector();
			for (let i = 1; i < line.length; i++) {
				const p0 = line[i - 1];
				const p1 = line[i];
				lineIntersector.computeIntersection(p, p0, p1);
				if (lineIntersector.hasIntersection()) return true;
			}
			return false;
		}
	}
};
// node_modules/jsts/org/locationtech/jts/geom/TopologyException.js
var TopologyException = class TopologyException extends RuntimeException {
	constructor(msg, pt) {
		super(pt ? msg + " [ " + pt + " ]" : msg);
		this.pt = pt ? new Coordinate(pt) : void 0;
		this.name = Object.keys({ TopologyException })[0];
	}
	getCoordinate() {
		return this.pt;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/TopologyLocation.js
var TopologyLocation = class TopologyLocation {
	constructor() {
		TopologyLocation.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.location = null;
		if (arguments.length === 1) {
			if (arguments[0] instanceof Array) {
				const location = arguments[0];
				this.init(location.length);
			} else if (Number.isInteger(arguments[0])) {
				const on = arguments[0];
				this.init(1);
				this.location[Position.ON] = on;
			} else if (arguments[0] instanceof TopologyLocation) {
				const gl = arguments[0];
				this.init(gl.location.length);
				if (gl !== null) for (let i = 0; i < this.location.length; i++) this.location[i] = gl.location[i];
			}
		} else if (arguments.length === 3) {
			const on = arguments[0], left = arguments[1], right = arguments[2];
			this.init(3);
			this.location[Position.ON] = on;
			this.location[Position.LEFT] = left;
			this.location[Position.RIGHT] = right;
		}
	}
	setAllLocations(locValue) {
		for (let i = 0; i < this.location.length; i++) this.location[i] = locValue;
	}
	isNull() {
		for (let i = 0; i < this.location.length; i++) if (this.location[i] !== Location.NONE) return false;
		return true;
	}
	setAllLocationsIfNull(locValue) {
		for (let i = 0; i < this.location.length; i++) if (this.location[i] === Location.NONE) this.location[i] = locValue;
	}
	isLine() {
		return this.location.length === 1;
	}
	merge(gl) {
		if (gl.location.length > this.location.length) {
			const newLoc = new Array(3).fill(null);
			newLoc[Position.ON] = this.location[Position.ON];
			newLoc[Position.LEFT] = Location.NONE;
			newLoc[Position.RIGHT] = Location.NONE;
			this.location = newLoc;
		}
		for (let i = 0; i < this.location.length; i++) if (this.location[i] === Location.NONE && i < gl.location.length) this.location[i] = gl.location[i];
	}
	getLocations() {
		return this.location;
	}
	flip() {
		if (this.location.length <= 1) return null;
		const temp = this.location[Position.LEFT];
		this.location[Position.LEFT] = this.location[Position.RIGHT];
		this.location[Position.RIGHT] = temp;
	}
	get(posIndex) {
		if (posIndex < this.location.length) return this.location[posIndex];
		return Location.NONE;
	}
	isEqualOnSide(le, locIndex) {
		return this.location[locIndex] === le.location[locIndex];
	}
	allPositionsEqual(loc) {
		for (let i = 0; i < this.location.length; i++) if (this.location[i] !== loc) return false;
		return true;
	}
	toString() {
		const buf = new StringBuffer();
		if (this.location.length > 1) buf.append(Location.toLocationSymbol(this.location[Position.LEFT]));
		buf.append(Location.toLocationSymbol(this.location[Position.ON]));
		if (this.location.length > 1) buf.append(Location.toLocationSymbol(this.location[Position.RIGHT]));
		return buf.toString();
	}
	setLocations(on, left, right) {
		this.location[Position.ON] = on;
		this.location[Position.LEFT] = left;
		this.location[Position.RIGHT] = right;
	}
	isArea() {
		return this.location.length > 1;
	}
	isAnyNull() {
		for (let i = 0; i < this.location.length; i++) if (this.location[i] === Location.NONE) return true;
		return false;
	}
	setLocation() {
		if (arguments.length === 1) {
			const locValue = arguments[0];
			this.setLocation(Position.ON, locValue);
		} else if (arguments.length === 2) {
			const locIndex = arguments[0], locValue = arguments[1];
			this.location[locIndex] = locValue;
		}
	}
	init(size) {
		this.location = new Array(size).fill(null);
		this.setAllLocations(Location.NONE);
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/Label.js
var Label = class Label {
	constructor() {
		Label.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.elt = new Array(2).fill(null);
		if (arguments.length === 1) {
			if (Number.isInteger(arguments[0])) {
				const onLoc = arguments[0];
				this.elt[0] = new TopologyLocation(onLoc);
				this.elt[1] = new TopologyLocation(onLoc);
			} else if (arguments[0] instanceof Label) {
				const lbl = arguments[0];
				this.elt[0] = new TopologyLocation(lbl.elt[0]);
				this.elt[1] = new TopologyLocation(lbl.elt[1]);
			}
		} else if (arguments.length === 2) {
			const geomIndex = arguments[0], onLoc = arguments[1];
			this.elt[0] = new TopologyLocation(Location.NONE);
			this.elt[1] = new TopologyLocation(Location.NONE);
			this.elt[geomIndex].setLocation(onLoc);
		} else if (arguments.length === 3) {
			const onLoc = arguments[0], leftLoc = arguments[1], rightLoc = arguments[2];
			this.elt[0] = new TopologyLocation(onLoc, leftLoc, rightLoc);
			this.elt[1] = new TopologyLocation(onLoc, leftLoc, rightLoc);
		} else if (arguments.length === 4) {
			const geomIndex = arguments[0], onLoc = arguments[1], leftLoc = arguments[2], rightLoc = arguments[3];
			this.elt[0] = new TopologyLocation(Location.NONE, Location.NONE, Location.NONE);
			this.elt[1] = new TopologyLocation(Location.NONE, Location.NONE, Location.NONE);
			this.elt[geomIndex].setLocations(onLoc, leftLoc, rightLoc);
		}
	}
	static toLineLabel(label) {
		const lineLabel = new Label(Location.NONE);
		for (let i = 0; i < 2; i++) lineLabel.setLocation(i, label.getLocation(i));
		return lineLabel;
	}
	getGeometryCount() {
		let count = 0;
		if (!this.elt[0].isNull()) count++;
		if (!this.elt[1].isNull()) count++;
		return count;
	}
	setAllLocations(geomIndex, location) {
		this.elt[geomIndex].setAllLocations(location);
	}
	isNull(geomIndex) {
		return this.elt[geomIndex].isNull();
	}
	setAllLocationsIfNull() {
		if (arguments.length === 1) {
			const location = arguments[0];
			this.setAllLocationsIfNull(0, location);
			this.setAllLocationsIfNull(1, location);
		} else if (arguments.length === 2) {
			const geomIndex = arguments[0], location = arguments[1];
			this.elt[geomIndex].setAllLocationsIfNull(location);
		}
	}
	isLine(geomIndex) {
		return this.elt[geomIndex].isLine();
	}
	merge(lbl) {
		for (let i = 0; i < 2; i++) if (this.elt[i] === null && lbl.elt[i] !== null) this.elt[i] = new TopologyLocation(lbl.elt[i]);
		else this.elt[i].merge(lbl.elt[i]);
	}
	flip() {
		this.elt[0].flip();
		this.elt[1].flip();
	}
	getLocation() {
		if (arguments.length === 1) {
			const geomIndex = arguments[0];
			return this.elt[geomIndex].get(Position.ON);
		} else if (arguments.length === 2) {
			const geomIndex = arguments[0], posIndex = arguments[1];
			return this.elt[geomIndex].get(posIndex);
		}
	}
	toString() {
		const buf = new StringBuffer();
		if (this.elt[0] !== null) {
			buf.append("A:");
			buf.append(this.elt[0].toString());
		}
		if (this.elt[1] !== null) {
			buf.append(" B:");
			buf.append(this.elt[1].toString());
		}
		return buf.toString();
	}
	setLocation() {
		if (arguments.length === 2) {
			const geomIndex = arguments[0], location = arguments[1];
			this.elt[geomIndex].setLocation(Position.ON, location);
		} else if (arguments.length === 3) {
			const geomIndex = arguments[0], posIndex = arguments[1], location = arguments[2];
			this.elt[geomIndex].setLocation(posIndex, location);
		}
	}
	isEqualOnSide(lbl, side) {
		return this.elt[0].isEqualOnSide(lbl.elt[0], side) && this.elt[1].isEqualOnSide(lbl.elt[1], side);
	}
	allPositionsEqual(geomIndex, loc) {
		return this.elt[geomIndex].allPositionsEqual(loc);
	}
	toLine(geomIndex) {
		if (this.elt[geomIndex].isArea()) this.elt[geomIndex] = new TopologyLocation(this.elt[geomIndex].location[0]);
	}
	isArea() {
		if (arguments.length === 0) return this.elt[0].isArea() || this.elt[1].isArea();
		else if (arguments.length === 1) {
			const geomIndex = arguments[0];
			return this.elt[geomIndex].isArea();
		}
	}
	isAnyNull(geomIndex) {
		return this.elt[geomIndex].isAnyNull();
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/EdgeRing.js
var EdgeRing = class EdgeRing {
	constructor() {
		EdgeRing.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._startDe = null;
		this._maxNodeDegree = -1;
		this._edges = new ArrayList();
		this._pts = new ArrayList();
		this._label = new Label(Location.NONE);
		this._ring = null;
		this._isHole = null;
		this._shell = null;
		this._holes = new ArrayList();
		this._geometryFactory = null;
		if (arguments.length === 0) {} else if (arguments.length === 2) {
			const start = arguments[0], geometryFactory = arguments[1];
			this._geometryFactory = geometryFactory;
			this.computePoints(start);
			this.computeRing();
		}
	}
	computeRing() {
		if (this._ring !== null) return null;
		const coord = new Array(this._pts.size()).fill(null);
		for (let i = 0; i < this._pts.size(); i++) coord[i] = this._pts.get(i);
		this._ring = this._geometryFactory.createLinearRing(coord);
		this._isHole = Orientation.isCCW(this._ring.getCoordinates());
	}
	isIsolated() {
		return this._label.getGeometryCount() === 1;
	}
	computePoints(start) {
		this._startDe = start;
		let de = start;
		let isFirstEdge = true;
		do {
			if (de === null) throw new TopologyException("Found null DirectedEdge");
			if (de.getEdgeRing() === this) throw new TopologyException("Directed Edge visited twice during ring-building at " + de.getCoordinate());
			this._edges.add(de);
			const label = de.getLabel();
			Assert.isTrue(label.isArea());
			this.mergeLabel(label);
			this.addPoints(de.getEdge(), de.isForward(), isFirstEdge);
			isFirstEdge = false;
			this.setEdgeRing(de, this);
			de = this.getNext(de);
		} while (de !== this._startDe);
	}
	getLinearRing() {
		return this._ring;
	}
	getCoordinate(i) {
		return this._pts.get(i);
	}
	computeMaxNodeDegree() {
		this._maxNodeDegree = 0;
		let de = this._startDe;
		do {
			const degree = de.getNode().getEdges().getOutgoingDegree(this);
			if (degree > this._maxNodeDegree) this._maxNodeDegree = degree;
			de = this.getNext(de);
		} while (de !== this._startDe);
		this._maxNodeDegree *= 2;
	}
	addPoints(edge, isForward, isFirstEdge) {
		const edgePts = edge.getCoordinates();
		if (isForward) {
			let startIndex = 1;
			if (isFirstEdge) startIndex = 0;
			for (let i = startIndex; i < edgePts.length; i++) this._pts.add(edgePts[i]);
		} else {
			let startIndex = edgePts.length - 2;
			if (isFirstEdge) startIndex = edgePts.length - 1;
			for (let i = startIndex; i >= 0; i--) this._pts.add(edgePts[i]);
		}
	}
	containsPoint(p) {
		const shell = this.getLinearRing();
		if (!shell.getEnvelopeInternal().contains(p)) return false;
		if (!PointLocation.isInRing(p, shell.getCoordinates())) return false;
		for (let i = this._holes.iterator(); i.hasNext();) if (i.next().containsPoint(p)) return false;
		return true;
	}
	getMaxNodeDegree() {
		if (this._maxNodeDegree < 0) this.computeMaxNodeDegree();
		return this._maxNodeDegree;
	}
	setShell(shell) {
		this._shell = shell;
		if (shell !== null) shell.addHole(this);
	}
	toPolygon(geometryFactory) {
		const holeLR = new Array(this._holes.size()).fill(null);
		for (let i = 0; i < this._holes.size(); i++) holeLR[i] = this._holes.get(i).getLinearRing();
		return geometryFactory.createPolygon(this.getLinearRing(), holeLR);
	}
	isHole() {
		return this._isHole;
	}
	setInResult() {
		let de = this._startDe;
		do {
			de.getEdge().setInResult(true);
			de = de.getNext();
		} while (de !== this._startDe);
	}
	addHole(ring) {
		this._holes.add(ring);
	}
	isShell() {
		return this._shell === null;
	}
	getLabel() {
		return this._label;
	}
	getEdges() {
		return this._edges;
	}
	getShell() {
		return this._shell;
	}
	mergeLabel() {
		if (arguments.length === 1) {
			const deLabel = arguments[0];
			this.mergeLabel(deLabel, 0);
			this.mergeLabel(deLabel, 1);
		} else if (arguments.length === 2) {
			const deLabel = arguments[0], geomIndex = arguments[1];
			const loc = deLabel.getLocation(geomIndex, Position.RIGHT);
			if (loc === Location.NONE) return null;
			if (this._label.getLocation(geomIndex) === Location.NONE) {
				this._label.setLocation(geomIndex, loc);
				return null;
			}
		}
	}
};
// node_modules/jsts/org/locationtech/jts/operation/overlay/MinimalEdgeRing.js
var MinimalEdgeRing = class MinimalEdgeRing extends EdgeRing {
	constructor() {
		super();
		MinimalEdgeRing.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const start = arguments[0], geometryFactory = arguments[1];
		EdgeRing.constructor_.call(this, start, geometryFactory);
	}
	getNext(de) {
		return de.getNextMin();
	}
	setEdgeRing(de, er) {
		de.setMinEdgeRing(er);
	}
};
// node_modules/jsts/org/locationtech/jts/operation/overlay/MaximalEdgeRing.js
var MaximalEdgeRing = class MaximalEdgeRing extends EdgeRing {
	constructor() {
		super();
		MaximalEdgeRing.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const start = arguments[0], geometryFactory = arguments[1];
		EdgeRing.constructor_.call(this, start, geometryFactory);
	}
	linkDirectedEdgesForMinimalEdgeRings() {
		let de = this._startDe;
		do {
			de.getNode().getEdges().linkMinimalDirectedEdges(this);
			de = de.getNext();
		} while (de !== this._startDe);
	}
	buildMinimalRings() {
		const minEdgeRings = new ArrayList();
		let de = this._startDe;
		do {
			if (de.getMinEdgeRing() === null) {
				const minEr = new MinimalEdgeRing(de, this._geometryFactory);
				minEdgeRings.add(minEr);
			}
			de = de.getNext();
		} while (de !== this._startDe);
		return minEdgeRings;
	}
	getNext(de) {
		return de.getNext();
	}
	setEdgeRing(de, er) {
		de.setEdgeRing(er);
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/locate/PointOnGeometryLocator.js
var PointOnGeometryLocator = class {
	locate(p) {}
};
// node_modules/jsts/java/util/Iterator.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/Iterator.html
* @constructor
* @private
*/
var Iterator = class {
	/**
	* Returns true if the iteration has more elements.
	* @return {boolean}
	*/
	hasNext() {}
	/**
	* Returns the next element in the iteration.
	* @return {Object}
	*/
	next() {}
	/**
	* Removes from the underlying collection the last element returned by the
	* iterator (optional operation).
	*/
	remove() {}
};
// node_modules/jsts/org/locationtech/jts/geom/GeometryCollectionIterator.js
var GeometryCollectionIterator = class GeometryCollectionIterator {
	constructor() {
		GeometryCollectionIterator.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._parent = null;
		this._atStart = null;
		this._max = null;
		this._index = null;
		this._subcollectionIterator = null;
		const parent = arguments[0];
		this._parent = parent;
		this._atStart = true;
		this._index = 0;
		this._max = parent.getNumGeometries();
	}
	static isAtomic(geom) {
		return !(geom instanceof GeometryCollection);
	}
	next() {
		if (this._atStart) {
			this._atStart = false;
			if (GeometryCollectionIterator.isAtomic(this._parent)) this._index++;
			return this._parent;
		}
		if (this._subcollectionIterator !== null) if (this._subcollectionIterator.hasNext()) return this._subcollectionIterator.next();
		else this._subcollectionIterator = null;
		if (this._index >= this._max) throw new NoSuchElementException();
		const obj = this._parent.getGeometryN(this._index++);
		if (obj instanceof GeometryCollection) {
			this._subcollectionIterator = new GeometryCollectionIterator(obj);
			return this._subcollectionIterator.next();
		}
		return obj;
	}
	hasNext() {
		if (this._atStart) return true;
		if (this._subcollectionIterator !== null) {
			if (this._subcollectionIterator.hasNext()) return true;
			this._subcollectionIterator = null;
		}
		if (this._index >= this._max) return false;
		return true;
	}
	remove() {
		throw new UnsupportedOperationException(this.getClass().getName());
	}
	get interfaces_() {
		return [Iterator];
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/locate/SimplePointInAreaLocator.js
var SimplePointInAreaLocator = class SimplePointInAreaLocator {
	constructor() {
		SimplePointInAreaLocator.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._geom = null;
		const geom = arguments[0];
		this._geom = geom;
	}
	static locatePointInPolygon(p, poly) {
		if (poly.isEmpty()) return Location.EXTERIOR;
		const shell = poly.getExteriorRing();
		const shellLoc = SimplePointInAreaLocator.locatePointInRing(p, shell);
		if (shellLoc !== Location.INTERIOR) return shellLoc;
		for (let i = 0; i < poly.getNumInteriorRing(); i++) {
			const hole = poly.getInteriorRingN(i);
			const holeLoc = SimplePointInAreaLocator.locatePointInRing(p, hole);
			if (holeLoc === Location.BOUNDARY) return Location.BOUNDARY;
			if (holeLoc === Location.INTERIOR) return Location.EXTERIOR;
		}
		return Location.INTERIOR;
	}
	static locatePointInRing(p, ring) {
		if (!ring.getEnvelopeInternal().intersects(p)) return Location.EXTERIOR;
		return PointLocation.locateInRing(p, ring.getCoordinates());
	}
	static isContained(p, geom) {
		return Location.EXTERIOR !== SimplePointInAreaLocator.locate(p, geom);
	}
	static locate(p, geom) {
		if (geom.isEmpty()) return Location.EXTERIOR;
		if (!geom.getEnvelopeInternal().intersects(p)) return Location.EXTERIOR;
		return SimplePointInAreaLocator.locateInGeometry(p, geom);
	}
	static containsPointInPolygon(p, poly) {
		return Location.EXTERIOR !== SimplePointInAreaLocator.locatePointInPolygon(p, poly);
	}
	static locateInGeometry(p, geom) {
		if (geom instanceof Polygon) return SimplePointInAreaLocator.locatePointInPolygon(p, geom);
		if (geom instanceof GeometryCollection) {
			const geomi = new GeometryCollectionIterator(geom);
			while (geomi.hasNext()) {
				const g2 = geomi.next();
				if (g2 !== geom) {
					const loc = SimplePointInAreaLocator.locateInGeometry(p, g2);
					if (loc !== Location.EXTERIOR) return loc;
				}
			}
		}
		return Location.EXTERIOR;
	}
	locate(p) {
		return SimplePointInAreaLocator.locate(p, this._geom);
	}
	get interfaces_() {
		return [PointOnGeometryLocator];
	}
};
// node_modules/jsts/java/util/SortedMap.js
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/SortedMap.html
*/
var SortedMap = class extends Map$1 {};
// node_modules/jsts/java/util/TreeMap.js
var BLACK = 0;
var RED = 1;
function colorOf(p) {
	return p == null ? BLACK : p.color;
}
function parentOf(p) {
	return p == null ? null : p.parent;
}
function setColor(p, c) {
	if (p !== null) p.color = c;
}
function leftOf(p) {
	return p == null ? null : p.left;
}
function rightOf(p) {
	return p == null ? null : p.right;
}
/**
* @see http://download.oracle.com/javase/6/docs/api/java/util/TreeMap.html
*/
var TreeMap = class TreeMap extends SortedMap {
	constructor() {
		super();
		this.root_ = null;
		this.size_ = 0;
	}
	get(key) {
		let p = this.root_;
		while (p !== null) {
			const cmp = key.compareTo(p.key);
			if (cmp < 0) p = p.left;
			else if (cmp > 0) p = p.right;
			else return p.value;
		}
		return null;
	}
	put(key, value) {
		if (this.root_ === null) {
			this.root_ = {
				key,
				value,
				left: null,
				right: null,
				parent: null,
				color: BLACK,
				getValue() {
					return this.value;
				},
				getKey() {
					return this.key;
				}
			};
			this.size_ = 1;
			return null;
		}
		let t = this.root_;
		let parent;
		let cmp;
		do {
			parent = t;
			cmp = key.compareTo(t.key);
			if (cmp < 0) t = t.left;
			else if (cmp > 0) t = t.right;
			else {
				const oldValue = t.value;
				t.value = value;
				return oldValue;
			}
		} while (t !== null);
		const e = {
			key,
			left: null,
			right: null,
			value,
			parent,
			color: BLACK,
			getValue() {
				return this.value;
			},
			getKey() {
				return this.key;
			}
		};
		if (cmp < 0) parent.left = e;
		else parent.right = e;
		this.fixAfterInsertion(e);
		this.size_++;
		return null;
	}
	/**
	* @param {Object} x
	*/
	fixAfterInsertion(x) {
		let y;
		x.color = RED;
		while (x != null && x !== this.root_ && x.parent.color === RED) if (parentOf(x) === leftOf(parentOf(parentOf(x)))) {
			y = rightOf(parentOf(parentOf(x)));
			if (colorOf(y) === RED) {
				setColor(parentOf(x), BLACK);
				setColor(y, BLACK);
				setColor(parentOf(parentOf(x)), RED);
				x = parentOf(parentOf(x));
			} else {
				if (x === rightOf(parentOf(x))) {
					x = parentOf(x);
					this.rotateLeft(x);
				}
				setColor(parentOf(x), BLACK);
				setColor(parentOf(parentOf(x)), RED);
				this.rotateRight(parentOf(parentOf(x)));
			}
		} else {
			y = leftOf(parentOf(parentOf(x)));
			if (colorOf(y) === RED) {
				setColor(parentOf(x), BLACK);
				setColor(y, BLACK);
				setColor(parentOf(parentOf(x)), RED);
				x = parentOf(parentOf(x));
			} else {
				if (x === leftOf(parentOf(x))) {
					x = parentOf(x);
					this.rotateRight(x);
				}
				setColor(parentOf(x), BLACK);
				setColor(parentOf(parentOf(x)), RED);
				this.rotateLeft(parentOf(parentOf(x)));
			}
		}
		this.root_.color = BLACK;
	}
	values() {
		const arrayList = new ArrayList();
		let p = this.getFirstEntry();
		if (p !== null) {
			arrayList.add(p.value);
			while ((p = TreeMap.successor(p)) !== null) arrayList.add(p.value);
		}
		return arrayList;
	}
	entrySet() {
		const hashSet = new HashSet();
		let p = this.getFirstEntry();
		if (p !== null) {
			hashSet.add(p);
			while ((p = TreeMap.successor(p)) !== null) hashSet.add(p);
		}
		return hashSet;
	}
	/**
	* @param {Object} p
	*/
	rotateLeft(p) {
		if (p != null) {
			const r = p.right;
			p.right = r.left;
			if (r.left != null) r.left.parent = p;
			r.parent = p.parent;
			if (p.parent == null) this.root_ = r;
			else if (p.parent.left === p) p.parent.left = r;
			else p.parent.right = r;
			r.left = p;
			p.parent = r;
		}
	}
	/**
	* @param {Object} p
	*/
	rotateRight(p) {
		if (p != null) {
			const l = p.left;
			p.left = l.right;
			if (l.right != null) l.right.parent = p;
			l.parent = p.parent;
			if (p.parent == null) this.root_ = l;
			else if (p.parent.right === p) p.parent.right = l;
			else p.parent.left = l;
			l.right = p;
			p.parent = l;
		}
	}
	/**
	* @return {Object}
	*/
	getFirstEntry() {
		let p = this.root_;
		if (p != null) while (p.left != null) p = p.left;
		return p;
	}
	/**
	* @param {Object} t
	* @return {Object}
	* @private
	*/
	static successor(t) {
		let p;
		if (t === null) return null;
		else if (t.right !== null) {
			p = t.right;
			while (p.left !== null) p = p.left;
			return p;
		} else {
			p = t.parent;
			let ch = t;
			while (p !== null && ch === p.right) {
				ch = p;
				p = p.parent;
			}
			return p;
		}
	}
	size() {
		return this.size_;
	}
	containsKey(key) {
		let p = this.root_;
		while (p !== null) {
			const cmp = key.compareTo(p.key);
			if (cmp < 0) p = p.left;
			else if (cmp > 0) p = p.right;
			else return true;
		}
		return false;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/EdgeEndStar.js
var EdgeEndStar = class EdgeEndStar {
	constructor() {
		EdgeEndStar.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._edgeMap = new TreeMap();
		this._edgeList = null;
		this._ptInAreaLocation = [Location.NONE, Location.NONE];
	}
	getNextCW(ee) {
		this.getEdges();
		const i = this._edgeList.indexOf(ee);
		let iNextCW = i - 1;
		if (i === 0) iNextCW = this._edgeList.size() - 1;
		return this._edgeList.get(iNextCW);
	}
	propagateSideLabels(geomIndex) {
		let startLoc = Location.NONE;
		for (let it = this.iterator(); it.hasNext();) {
			const label = it.next().getLabel();
			if (label.isArea(geomIndex) && label.getLocation(geomIndex, Position.LEFT) !== Location.NONE) startLoc = label.getLocation(geomIndex, Position.LEFT);
		}
		if (startLoc === Location.NONE) return null;
		let currLoc = startLoc;
		for (let it = this.iterator(); it.hasNext();) {
			const e = it.next();
			const label = e.getLabel();
			if (label.getLocation(geomIndex, Position.ON) === Location.NONE) label.setLocation(geomIndex, Position.ON, currLoc);
			if (label.isArea(geomIndex)) {
				const leftLoc = label.getLocation(geomIndex, Position.LEFT);
				const rightLoc = label.getLocation(geomIndex, Position.RIGHT);
				if (rightLoc !== Location.NONE) {
					if (rightLoc !== currLoc) throw new TopologyException("side location conflict", e.getCoordinate());
					if (leftLoc === Location.NONE) Assert.shouldNeverReachHere("found single null side (at " + e.getCoordinate() + ")");
					currLoc = leftLoc;
				} else {
					Assert.isTrue(label.getLocation(geomIndex, Position.LEFT) === Location.NONE, "found single null side");
					label.setLocation(geomIndex, Position.RIGHT, currLoc);
					label.setLocation(geomIndex, Position.LEFT, currLoc);
				}
			}
		}
	}
	getCoordinate() {
		const it = this.iterator();
		if (!it.hasNext()) return null;
		return it.next().getCoordinate();
	}
	checkAreaLabelsConsistent(geomIndex) {
		const edges = this.getEdges();
		if (edges.size() <= 0) return true;
		const lastEdgeIndex = edges.size() - 1;
		const startLoc = edges.get(lastEdgeIndex).getLabel().getLocation(geomIndex, Position.LEFT);
		Assert.isTrue(startLoc !== Location.NONE, "Found unlabelled area edge");
		let currLoc = startLoc;
		for (let it = this.iterator(); it.hasNext();) {
			const label = it.next().getLabel();
			Assert.isTrue(label.isArea(geomIndex), "Found non-area edge");
			const leftLoc = label.getLocation(geomIndex, Position.LEFT);
			const rightLoc = label.getLocation(geomIndex, Position.RIGHT);
			if (leftLoc === rightLoc) return false;
			if (rightLoc !== currLoc) return false;
			currLoc = leftLoc;
		}
		return true;
	}
	findIndex(eSearch) {
		this.iterator();
		for (let i = 0; i < this._edgeList.size(); i++) if (this._edgeList.get(i) === eSearch) return i;
		return -1;
	}
	iterator() {
		return this.getEdges().iterator();
	}
	getEdges() {
		if (this._edgeList === null) this._edgeList = new ArrayList(this._edgeMap.values());
		return this._edgeList;
	}
	getLocation(geomIndex, p, geom) {
		if (this._ptInAreaLocation[geomIndex] === Location.NONE) this._ptInAreaLocation[geomIndex] = SimplePointInAreaLocator.locate(p, geom[geomIndex].getGeometry());
		return this._ptInAreaLocation[geomIndex];
	}
	toString() {
		const buf = new StringBuffer();
		buf.append("EdgeEndStar:   " + this.getCoordinate());
		buf.append("\n");
		for (let it = this.iterator(); it.hasNext();) {
			const e = it.next();
			buf.append(e);
			buf.append("\n");
		}
		return buf.toString();
	}
	computeEdgeEndLabels(boundaryNodeRule) {
		for (let it = this.iterator(); it.hasNext();) it.next().computeLabel(boundaryNodeRule);
	}
	computeLabelling(geomGraph) {
		this.computeEdgeEndLabels(geomGraph[0].getBoundaryNodeRule());
		this.propagateSideLabels(0);
		this.propagateSideLabels(1);
		const hasDimensionalCollapseEdge = [false, false];
		for (let it = this.iterator(); it.hasNext();) {
			const label = it.next().getLabel();
			for (let geomi = 0; geomi < 2; geomi++) if (label.isLine(geomi) && label.getLocation(geomi) === Location.BOUNDARY) hasDimensionalCollapseEdge[geomi] = true;
		}
		for (let it = this.iterator(); it.hasNext();) {
			const e = it.next();
			const label = e.getLabel();
			for (let geomi = 0; geomi < 2; geomi++) if (label.isAnyNull(geomi)) {
				let loc = Location.NONE;
				if (hasDimensionalCollapseEdge[geomi]) loc = Location.EXTERIOR;
				else {
					const p = e.getCoordinate();
					loc = this.getLocation(geomi, p, geomGraph);
				}
				label.setAllLocationsIfNull(geomi, loc);
			}
		}
	}
	getDegree() {
		return this._edgeMap.size();
	}
	insertEdgeEnd(e, obj) {
		this._edgeMap.put(e, obj);
		this._edgeList = null;
	}
	print(out) {
		System.out.println("EdgeEndStar:   " + this.getCoordinate());
		for (let it = this.iterator(); it.hasNext();) it.next().print(out);
	}
	isAreaLabelsConsistent(geomGraph) {
		this.computeEdgeEndLabels(geomGraph.getBoundaryNodeRule());
		return this.checkAreaLabelsConsistent(0);
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/Quadrant.js
var Quadrant = class Quadrant {
	static isNorthern(quad) {
		return quad === Quadrant.NE || quad === Quadrant.NW;
	}
	static isOpposite(quad1, quad2) {
		if (quad1 === quad2) return false;
		if ((quad1 - quad2 + 4) % 4 === 2) return true;
		return false;
	}
	static commonHalfPlane(quad1, quad2) {
		if (quad1 === quad2) return quad1;
		if ((quad1 - quad2 + 4) % 4 === 2) return -1;
		const min = quad1 < quad2 ? quad1 : quad2;
		if (min === 0 && (quad1 > quad2 ? quad1 : quad2) === 3) return 3;
		return min;
	}
	static isInHalfPlane(quad, halfPlane) {
		if (halfPlane === Quadrant.SE) return quad === Quadrant.SE || quad === Quadrant.SW;
		return quad === halfPlane || quad === halfPlane + 1;
	}
	static quadrant() {
		if (typeof arguments[0] === "number" && typeof arguments[1] === "number") {
			const dx = arguments[0], dy = arguments[1];
			if (dx === 0 && dy === 0) throw new IllegalArgumentException("Cannot compute the quadrant for point ( " + dx + ", " + dy + " )");
			if (dx >= 0) if (dy >= 0) return Quadrant.NE;
			else return Quadrant.SE;
			else if (dy >= 0) return Quadrant.NW;
			else return Quadrant.SW;
		} else if (arguments[0] instanceof Coordinate && arguments[1] instanceof Coordinate) {
			const p0 = arguments[0], p1 = arguments[1];
			if (p1.x === p0.x && p1.y === p0.y) throw new IllegalArgumentException("Cannot compute the quadrant for two identical points " + p0);
			if (p1.x >= p0.x) if (p1.y >= p0.y) return Quadrant.NE;
			else return Quadrant.SE;
			else if (p1.y >= p0.y) return Quadrant.NW;
			else return Quadrant.SW;
		}
	}
};
Quadrant.NE = 0;
Quadrant.NW = 1;
Quadrant.SW = 2;
Quadrant.SE = 3;
// node_modules/jsts/org/locationtech/jts/geomgraph/DirectedEdgeStar.js
var DirectedEdgeStar = class DirectedEdgeStar extends EdgeEndStar {
	constructor() {
		super();
		DirectedEdgeStar.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._resultAreaEdgeList = null;
		this._label = null;
		this._SCANNING_FOR_INCOMING = 1;
		this._LINKING_TO_OUTGOING = 2;
	}
	linkResultDirectedEdges() {
		this.getResultAreaEdges();
		let firstOut = null;
		let incoming = null;
		let state = this._SCANNING_FOR_INCOMING;
		for (let i = 0; i < this._resultAreaEdgeList.size(); i++) {
			const nextOut = this._resultAreaEdgeList.get(i);
			const nextIn = nextOut.getSym();
			if (!nextOut.getLabel().isArea()) continue;
			if (firstOut === null && nextOut.isInResult()) firstOut = nextOut;
			switch (state) {
				case this._SCANNING_FOR_INCOMING:
					if (!nextIn.isInResult()) continue;
					incoming = nextIn;
					state = this._LINKING_TO_OUTGOING;
					break;
				case this._LINKING_TO_OUTGOING:
					if (!nextOut.isInResult()) continue;
					incoming.setNext(nextOut);
					state = this._SCANNING_FOR_INCOMING;
			}
		}
		if (state === this._LINKING_TO_OUTGOING) {
			if (firstOut === null) throw new TopologyException("no outgoing dirEdge found", this.getCoordinate());
			Assert.isTrue(firstOut.isInResult(), "unable to link last incoming dirEdge");
			incoming.setNext(firstOut);
		}
	}
	insert(ee) {
		const de = ee;
		this.insertEdgeEnd(de, de);
	}
	getRightmostEdge() {
		const edges = this.getEdges();
		const size = edges.size();
		if (size < 1) return null;
		const de0 = edges.get(0);
		if (size === 1) return de0;
		const deLast = edges.get(size - 1);
		const quad0 = de0.getQuadrant();
		const quad1 = deLast.getQuadrant();
		if (Quadrant.isNorthern(quad0) && Quadrant.isNorthern(quad1)) return de0;
		else if (!Quadrant.isNorthern(quad0) && !Quadrant.isNorthern(quad1)) return deLast;
		else if (de0.getDy() !== 0) return de0;
		else if (deLast.getDy() !== 0) return deLast;
		Assert.shouldNeverReachHere("found two horizontal edges incident on node");
		return null;
	}
	updateLabelling(nodeLabel) {
		for (let it = this.iterator(); it.hasNext();) {
			const label = it.next().getLabel();
			label.setAllLocationsIfNull(0, nodeLabel.getLocation(0));
			label.setAllLocationsIfNull(1, nodeLabel.getLocation(1));
		}
	}
	linkAllDirectedEdges() {
		this.getEdges();
		let prevOut = null;
		let firstIn = null;
		for (let i = this._edgeList.size() - 1; i >= 0; i--) {
			const nextOut = this._edgeList.get(i);
			const nextIn = nextOut.getSym();
			if (firstIn === null) firstIn = nextIn;
			if (prevOut !== null) nextIn.setNext(prevOut);
			prevOut = nextOut;
		}
		firstIn.setNext(prevOut);
	}
	computeDepths() {
		if (arguments.length === 1) {
			const de = arguments[0];
			const edgeIndex = this.findIndex(de);
			const startDepth = de.getDepth(Position.LEFT);
			const targetLastDepth = de.getDepth(Position.RIGHT);
			const nextDepth = this.computeDepths(edgeIndex + 1, this._edgeList.size(), startDepth);
			if (this.computeDepths(0, edgeIndex, nextDepth) !== targetLastDepth) throw new TopologyException("depth mismatch at " + de.getCoordinate());
		} else if (arguments.length === 3) {
			const startIndex = arguments[0], endIndex = arguments[1];
			let currDepth = arguments[2];
			for (let i = startIndex; i < endIndex; i++) {
				const nextDe = this._edgeList.get(i);
				nextDe.setEdgeDepths(Position.RIGHT, currDepth);
				currDepth = nextDe.getDepth(Position.LEFT);
			}
			return currDepth;
		}
	}
	mergeSymLabels() {
		for (let it = this.iterator(); it.hasNext();) {
			const de = it.next();
			de.getLabel().merge(de.getSym().getLabel());
		}
	}
	linkMinimalDirectedEdges(er) {
		let firstOut = null;
		let incoming = null;
		let state = this._SCANNING_FOR_INCOMING;
		for (let i = this._resultAreaEdgeList.size() - 1; i >= 0; i--) {
			const nextOut = this._resultAreaEdgeList.get(i);
			const nextIn = nextOut.getSym();
			if (firstOut === null && nextOut.getEdgeRing() === er) firstOut = nextOut;
			switch (state) {
				case this._SCANNING_FOR_INCOMING:
					if (nextIn.getEdgeRing() !== er) continue;
					incoming = nextIn;
					state = this._LINKING_TO_OUTGOING;
					break;
				case this._LINKING_TO_OUTGOING:
					if (nextOut.getEdgeRing() !== er) continue;
					incoming.setNextMin(nextOut);
					state = this._SCANNING_FOR_INCOMING;
			}
		}
		if (state === this._LINKING_TO_OUTGOING) {
			Assert.isTrue(firstOut !== null, "found null for first outgoing dirEdge");
			Assert.isTrue(firstOut.getEdgeRing() === er, "unable to link last incoming dirEdge");
			incoming.setNextMin(firstOut);
		}
	}
	getOutgoingDegree() {
		if (arguments.length === 0) {
			let degree = 0;
			for (let it = this.iterator(); it.hasNext();) if (it.next().isInResult()) degree++;
			return degree;
		} else if (arguments.length === 1) {
			const er = arguments[0];
			let degree = 0;
			for (let it = this.iterator(); it.hasNext();) if (it.next().getEdgeRing() === er) degree++;
			return degree;
		}
	}
	getLabel() {
		return this._label;
	}
	findCoveredLineEdges() {
		let startLoc = Location.NONE;
		for (let it = this.iterator(); it.hasNext();) {
			const nextOut = it.next();
			const nextIn = nextOut.getSym();
			if (!nextOut.isLineEdge()) {
				if (nextOut.isInResult()) {
					startLoc = Location.INTERIOR;
					break;
				}
				if (nextIn.isInResult()) {
					startLoc = Location.EXTERIOR;
					break;
				}
			}
		}
		if (startLoc === Location.NONE) return null;
		let currLoc = startLoc;
		for (let it = this.iterator(); it.hasNext();) {
			const nextOut = it.next();
			const nextIn = nextOut.getSym();
			if (nextOut.isLineEdge()) nextOut.getEdge().setCovered(currLoc === Location.INTERIOR);
			else {
				if (nextOut.isInResult()) currLoc = Location.EXTERIOR;
				if (nextIn.isInResult()) currLoc = Location.INTERIOR;
			}
		}
	}
	computeLabelling(geom) {
		super.computeLabelling.call(this, geom);
		this._label = new Label(Location.NONE);
		for (let it = this.iterator(); it.hasNext();) {
			const eLabel = it.next().getEdge().getLabel();
			for (let i = 0; i < 2; i++) {
				const eLoc = eLabel.getLocation(i);
				if (eLoc === Location.INTERIOR || eLoc === Location.BOUNDARY) this._label.setLocation(i, Location.INTERIOR);
			}
		}
	}
	print(out) {
		System.out.println("DirectedEdgeStar: " + this.getCoordinate());
		for (let it = this.iterator(); it.hasNext();) {
			const de = it.next();
			out.print("out ");
			de.print(out);
			out.println();
			out.print("in ");
			de.getSym().print(out);
			out.println();
		}
	}
	getResultAreaEdges() {
		if (this._resultAreaEdgeList !== null) return this._resultAreaEdgeList;
		this._resultAreaEdgeList = new ArrayList();
		for (let it = this.iterator(); it.hasNext();) {
			const de = it.next();
			if (de.isInResult() || de.getSym().isInResult()) this._resultAreaEdgeList.add(de);
		}
		return this._resultAreaEdgeList;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/GraphComponent.js
var GraphComponent = class GraphComponent {
	constructor() {
		GraphComponent.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._label = null;
		this._isInResult = false;
		this._isCovered = false;
		this._isCoveredSet = false;
		this._isVisited = false;
		if (arguments.length === 0) {} else if (arguments.length === 1) {
			const label = arguments[0];
			this._label = label;
		}
	}
	setVisited(isVisited) {
		this._isVisited = isVisited;
	}
	setInResult(isInResult) {
		this._isInResult = isInResult;
	}
	setLabel(label) {
		this._label = label;
	}
	getLabel() {
		return this._label;
	}
	setCovered(isCovered) {
		this._isCovered = isCovered;
		this._isCoveredSet = true;
	}
	updateIM(im) {
		Assert.isTrue(this._label.getGeometryCount() >= 2, "found partial label");
		this.computeIM(im);
	}
	isCovered() {
		return this._isCovered;
	}
	isCoveredSet() {
		return this._isCoveredSet;
	}
	isInResult() {
		return this._isInResult;
	}
	isVisited() {
		return this._isVisited;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/Node.js
var Node = class Node extends GraphComponent {
	constructor() {
		super();
		Node.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._coord = null;
		this._edges = null;
		const coord = arguments[0], edges = arguments[1];
		this._coord = coord;
		this._edges = edges;
		this._label = new Label(0, Location.NONE);
	}
	isIncidentEdgeInResult() {
		for (let it = this.getEdges().getEdges().iterator(); it.hasNext();) if (it.next().getEdge().isInResult()) return true;
		return false;
	}
	isIsolated() {
		return this._label.getGeometryCount() === 1;
	}
	getCoordinate() {
		return this._coord;
	}
	computeMergedLocation(label2, eltIndex) {
		let loc = Location.NONE;
		loc = this._label.getLocation(eltIndex);
		if (!label2.isNull(eltIndex)) {
			const nLoc = label2.getLocation(eltIndex);
			if (loc !== Location.BOUNDARY) loc = nLoc;
		}
		return loc;
	}
	setLabel() {
		if (arguments.length === 2 && Number.isInteger(arguments[1]) && Number.isInteger(arguments[0])) {
			const argIndex = arguments[0], onLocation = arguments[1];
			if (this._label === null) this._label = new Label(argIndex, onLocation);
			else this._label.setLocation(argIndex, onLocation);
		} else return super.setLabel.apply(this, arguments);
	}
	getEdges() {
		return this._edges;
	}
	mergeLabel() {
		if (arguments[0] instanceof Node) {
			const n = arguments[0];
			this.mergeLabel(n._label);
		} else if (arguments[0] instanceof Label) {
			const label2 = arguments[0];
			for (let i = 0; i < 2; i++) {
				const loc = this.computeMergedLocation(label2, i);
				if (this._label.getLocation(i) === Location.NONE) this._label.setLocation(i, loc);
			}
		}
	}
	add(e) {
		this._edges.insert(e);
		e.setNode(this);
	}
	setLabelBoundary(argIndex) {
		if (this._label === null) return null;
		let loc = Location.NONE;
		if (this._label !== null) loc = this._label.getLocation(argIndex);
		let newLoc = null;
		switch (loc) {
			case Location.BOUNDARY:
				newLoc = Location.INTERIOR;
				break;
			case Location.INTERIOR:
				newLoc = Location.BOUNDARY;
				break;
			default: newLoc = Location.BOUNDARY;
		}
		this._label.setLocation(argIndex, newLoc);
	}
	print(out) {
		out.println("node " + this._coord + " lbl: " + this._label);
	}
	computeIM(im) {}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/NodeFactory.js
var NodeFactory = class {
	createNode(coord) {
		return new Node(coord, null);
	}
};
// node_modules/jsts/org/locationtech/jts/operation/overlay/OverlayNodeFactory.js
var OverlayNodeFactory = class extends NodeFactory {
	constructor() {
		super();
	}
	createNode(coord) {
		return new Node(coord, new DirectedEdgeStar());
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/NodeMap.js
var NodeMap = class NodeMap {
	constructor() {
		NodeMap.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.nodeMap = new TreeMap();
		this.nodeFact = null;
		const nodeFact = arguments[0];
		this.nodeFact = nodeFact;
	}
	print(out) {
		for (let it = this.iterator(); it.hasNext();) it.next().print(out);
	}
	iterator() {
		return this.nodeMap.values().iterator();
	}
	values() {
		return this.nodeMap.values();
	}
	getBoundaryNodes(geomIndex) {
		const bdyNodes = new ArrayList();
		for (let i = this.iterator(); i.hasNext();) {
			const node = i.next();
			if (node.getLabel().getLocation(geomIndex) === Location.BOUNDARY) bdyNodes.add(node);
		}
		return bdyNodes;
	}
	add(e) {
		const p = e.getCoordinate();
		this.addNode(p).add(e);
	}
	find(coord) {
		return this.nodeMap.get(coord);
	}
	addNode() {
		if (arguments[0] instanceof Coordinate) {
			const coord = arguments[0];
			let node = this.nodeMap.get(coord);
			if (node === null) {
				node = this.nodeFact.createNode(coord);
				this.nodeMap.put(coord, node);
			}
			return node;
		} else if (arguments[0] instanceof Node) {
			const n = arguments[0];
			const node = this.nodeMap.get(n.getCoordinate());
			if (node === null) {
				this.nodeMap.put(n.getCoordinate(), n);
				return n;
			}
			node.mergeLabel(n);
			return node;
		}
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/EdgeEnd.js
var EdgeEnd = class EdgeEnd {
	constructor() {
		EdgeEnd.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._edge = null;
		this._label = null;
		this._node = null;
		this._p0 = null;
		this._p1 = null;
		this._dx = null;
		this._dy = null;
		this._quadrant = null;
		if (arguments.length === 1) {
			const edge = arguments[0];
			this._edge = edge;
		} else if (arguments.length === 3) {
			const edge = arguments[0], p0 = arguments[1], p1 = arguments[2];
			EdgeEnd.constructor_.call(this, edge, p0, p1, null);
		} else if (arguments.length === 4) {
			const edge = arguments[0], p0 = arguments[1], p1 = arguments[2], label = arguments[3];
			EdgeEnd.constructor_.call(this, edge);
			this.init(p0, p1);
			this._label = label;
		}
	}
	compareDirection(e) {
		if (this._dx === e._dx && this._dy === e._dy) return 0;
		if (this._quadrant > e._quadrant) return 1;
		if (this._quadrant < e._quadrant) return -1;
		return Orientation.index(e._p0, e._p1, this._p1);
	}
	getDy() {
		return this._dy;
	}
	print(out) {
		const angle = Math.atan2(this._dy, this._dx);
		const className = this.getClass().getName();
		const lastDotPos = className.lastIndexOf(".");
		const name = className.substring(lastDotPos + 1);
		out.print("  " + name + ": " + this._p0 + " - " + this._p1 + " " + this._quadrant + ":" + angle + "   " + this._label);
	}
	getLabel() {
		return this._label;
	}
	getEdge() {
		return this._edge;
	}
	toString() {
		const angle = Math.atan2(this._dy, this._dx);
		const className = this.getClass().getName();
		const lastDotPos = className.lastIndexOf(".");
		return "  " + className.substring(lastDotPos + 1) + ": " + this._p0 + " - " + this._p1 + " " + this._quadrant + ":" + angle + "   " + this._label;
	}
	computeLabel(boundaryNodeRule) {}
	init(p0, p1) {
		this._p0 = p0;
		this._p1 = p1;
		this._dx = p1.x - p0.x;
		this._dy = p1.y - p0.y;
		this._quadrant = Quadrant.quadrant(this._dx, this._dy);
		Assert.isTrue(!(this._dx === 0 && this._dy === 0), "EdgeEnd with identical endpoints found");
	}
	getCoordinate() {
		return this._p0;
	}
	setNode(node) {
		this._node = node;
	}
	compareTo(obj) {
		const e = obj;
		return this.compareDirection(e);
	}
	getDirectedCoordinate() {
		return this._p1;
	}
	getDx() {
		return this._dx;
	}
	getQuadrant() {
		return this._quadrant;
	}
	getNode() {
		return this._node;
	}
	get interfaces_() {
		return [Comparable];
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/DirectedEdge.js
var DirectedEdge = class DirectedEdge extends EdgeEnd {
	constructor() {
		super();
		DirectedEdge.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._isForward = null;
		this._isInResult = false;
		this._isVisited = false;
		this._sym = null;
		this._next = null;
		this._nextMin = null;
		this._edgeRing = null;
		this._minEdgeRing = null;
		this._depth = [
			0,
			-999,
			-999
		];
		const edge = arguments[0], isForward = arguments[1];
		EdgeEnd.constructor_.call(this, edge);
		this._isForward = isForward;
		if (isForward) this.init(edge.getCoordinate(0), edge.getCoordinate(1));
		else {
			const n = edge.getNumPoints() - 1;
			this.init(edge.getCoordinate(n), edge.getCoordinate(n - 1));
		}
		this.computeDirectedLabel();
	}
	static depthFactor(currLocation, nextLocation) {
		if (currLocation === Location.EXTERIOR && nextLocation === Location.INTERIOR) return 1;
		else if (currLocation === Location.INTERIOR && nextLocation === Location.EXTERIOR) return -1;
		return 0;
	}
	setVisited(isVisited) {
		this._isVisited = isVisited;
	}
	setDepth(position, depthVal) {
		if (this._depth[position] !== -999) {
			if (this._depth[position] !== depthVal) throw new TopologyException("assigned depths do not match", this.getCoordinate());
		}
		this._depth[position] = depthVal;
	}
	isInteriorAreaEdge() {
		let isInteriorAreaEdge = true;
		for (let i = 0; i < 2; i++) if (!(this._label.isArea(i) && this._label.getLocation(i, Position.LEFT) === Location.INTERIOR && this._label.getLocation(i, Position.RIGHT) === Location.INTERIOR)) isInteriorAreaEdge = false;
		return isInteriorAreaEdge;
	}
	setNextMin(nextMin) {
		this._nextMin = nextMin;
	}
	print(out) {
		super.print.call(this, out);
		out.print(" " + this._depth[Position.LEFT] + "/" + this._depth[Position.RIGHT]);
		out.print(" (" + this.getDepthDelta() + ")");
		if (this._isInResult) out.print(" inResult");
	}
	setMinEdgeRing(minEdgeRing) {
		this._minEdgeRing = minEdgeRing;
	}
	getSym() {
		return this._sym;
	}
	isForward() {
		return this._isForward;
	}
	setSym(de) {
		this._sym = de;
	}
	setVisitedEdge(isVisited) {
		this.setVisited(isVisited);
		this._sym.setVisited(isVisited);
	}
	getNextMin() {
		return this._nextMin;
	}
	getDepth(position) {
		return this._depth[position];
	}
	computeDirectedLabel() {
		this._label = new Label(this._edge.getLabel());
		if (!this._isForward) this._label.flip();
	}
	getNext() {
		return this._next;
	}
	isLineEdge() {
		const isLine = this._label.isLine(0) || this._label.isLine(1);
		const isExteriorIfArea0 = !this._label.isArea(0) || this._label.allPositionsEqual(0, Location.EXTERIOR);
		const isExteriorIfArea1 = !this._label.isArea(1) || this._label.allPositionsEqual(1, Location.EXTERIOR);
		return isLine && isExteriorIfArea0 && isExteriorIfArea1;
	}
	setEdgeRing(edgeRing) {
		this._edgeRing = edgeRing;
	}
	getMinEdgeRing() {
		return this._minEdgeRing;
	}
	getDepthDelta() {
		let depthDelta = this._edge.getDepthDelta();
		if (!this._isForward) depthDelta = -depthDelta;
		return depthDelta;
	}
	setInResult(isInResult) {
		this._isInResult = isInResult;
	}
	getEdge() {
		return this._edge;
	}
	printEdge(out) {
		this.print(out);
		out.print(" ");
		if (this._isForward) this._edge.print(out);
		else this._edge.printReverse(out);
	}
	setEdgeDepths(position, depth) {
		let depthDelta = this.getEdge().getDepthDelta();
		if (!this._isForward) depthDelta = -depthDelta;
		let directionFactor = 1;
		if (position === Position.LEFT) directionFactor = -1;
		const oppositePos = Position.opposite(position);
		const oppositeDepth = depth + depthDelta * directionFactor;
		this.setDepth(position, depth);
		this.setDepth(oppositePos, oppositeDepth);
	}
	getEdgeRing() {
		return this._edgeRing;
	}
	isInResult() {
		return this._isInResult;
	}
	setNext(next) {
		this._next = next;
	}
	isVisited() {
		return this._isVisited;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/PlanarGraph.js
var PlanarGraph = class PlanarGraph {
	constructor() {
		PlanarGraph.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._edges = new ArrayList();
		this._nodes = null;
		this._edgeEndList = new ArrayList();
		if (arguments.length === 0) this._nodes = new NodeMap(new NodeFactory());
		else if (arguments.length === 1) {
			const nodeFact = arguments[0];
			this._nodes = new NodeMap(nodeFact);
		}
	}
	static linkResultDirectedEdges(nodes) {
		for (let nodeit = nodes.iterator(); nodeit.hasNext();) nodeit.next().getEdges().linkResultDirectedEdges();
	}
	printEdges(out) {
		out.println("Edges:");
		for (let i = 0; i < this._edges.size(); i++) {
			out.println("edge " + i + ":");
			const e = this._edges.get(i);
			e.print(out);
			e.eiList.print(out);
		}
	}
	debugPrintln(o) {
		System.out.println(o);
	}
	isBoundaryNode(geomIndex, coord) {
		const node = this._nodes.find(coord);
		if (node === null) return false;
		const label = node.getLabel();
		if (label !== null && label.getLocation(geomIndex) === Location.BOUNDARY) return true;
		return false;
	}
	linkAllDirectedEdges() {
		for (let nodeit = this._nodes.iterator(); nodeit.hasNext();) nodeit.next().getEdges().linkAllDirectedEdges();
	}
	debugPrint(o) {
		System.out.print(o);
	}
	findEdgeEnd(e) {
		for (let i = this.getEdgeEnds().iterator(); i.hasNext();) {
			const ee = i.next();
			if (ee.getEdge() === e) return ee;
		}
		return null;
	}
	getNodes() {
		return this._nodes.values();
	}
	findEdge(p0, p1) {
		for (let i = 0; i < this._edges.size(); i++) {
			const e = this._edges.get(i);
			const eCoord = e.getCoordinates();
			if (p0.equals(eCoord[0]) && p1.equals(eCoord[1])) return e;
		}
		return null;
	}
	find(coord) {
		return this._nodes.find(coord);
	}
	addNode() {
		if (arguments[0] instanceof Node) {
			const node = arguments[0];
			return this._nodes.addNode(node);
		} else if (arguments[0] instanceof Coordinate) {
			const coord = arguments[0];
			return this._nodes.addNode(coord);
		}
	}
	getNodeIterator() {
		return this._nodes.iterator();
	}
	linkResultDirectedEdges() {
		for (let nodeit = this._nodes.iterator(); nodeit.hasNext();) nodeit.next().getEdges().linkResultDirectedEdges();
	}
	matchInSameDirection(p0, p1, ep0, ep1) {
		if (!p0.equals(ep0)) return false;
		if (Orientation.index(p0, p1, ep1) === Orientation.COLLINEAR && Quadrant.quadrant(p0, p1) === Quadrant.quadrant(ep0, ep1)) return true;
		return false;
	}
	getEdgeEnds() {
		return this._edgeEndList;
	}
	getEdgeIterator() {
		return this._edges.iterator();
	}
	findEdgeInSameDirection(p0, p1) {
		for (let i = 0; i < this._edges.size(); i++) {
			const e = this._edges.get(i);
			const eCoord = e.getCoordinates();
			if (this.matchInSameDirection(p0, p1, eCoord[0], eCoord[1])) return e;
			if (this.matchInSameDirection(p0, p1, eCoord[eCoord.length - 1], eCoord[eCoord.length - 2])) return e;
		}
		return null;
	}
	insertEdge(e) {
		this._edges.add(e);
	}
	addEdges(edgesToAdd) {
		for (let it = edgesToAdd.iterator(); it.hasNext();) {
			const e = it.next();
			this._edges.add(e);
			const de1 = new DirectedEdge(e, true);
			const de2 = new DirectedEdge(e, false);
			de1.setSym(de2);
			de2.setSym(de1);
			this.add(de1);
			this.add(de2);
		}
	}
	add(e) {
		this._nodes.add(e);
		this._edgeEndList.add(e);
	}
};
// node_modules/jsts/org/locationtech/jts/operation/valid/ConnectedInteriorTester.js
var ConnectedInteriorTester = class ConnectedInteriorTester {
	constructor() {
		ConnectedInteriorTester.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._geometryFactory = new GeometryFactory();
		this._geomGraph = null;
		this._disconnectedRingcoord = null;
		const geomGraph = arguments[0];
		this._geomGraph = geomGraph;
	}
	static findDifferentPoint(coord, pt) {
		for (let i = 0; i < coord.length; i++) if (!coord[i].equals(pt)) return coord[i];
		return null;
	}
	visitInteriorRing(ring, graph) {
		if (ring.isEmpty()) return null;
		const pts = ring.getCoordinates();
		const pt0 = pts[0];
		const pt1 = ConnectedInteriorTester.findDifferentPoint(pts, pt0);
		const e = graph.findEdgeInSameDirection(pt0, pt1);
		const de = graph.findEdgeEnd(e);
		let intDe = null;
		if (de.getLabel().getLocation(0, Position.RIGHT) === Location.INTERIOR) intDe = de;
		else if (de.getSym().getLabel().getLocation(0, Position.RIGHT) === Location.INTERIOR) intDe = de.getSym();
		Assert.isTrue(intDe !== null, "unable to find dirEdge with Interior on RHS");
		this.visitLinkedDirectedEdges(intDe);
	}
	visitShellInteriors(g, graph) {
		if (g instanceof Polygon) {
			const p = g;
			this.visitInteriorRing(p.getExteriorRing(), graph);
		}
		if (g instanceof MultiPolygon) {
			const mp = g;
			for (let i = 0; i < mp.getNumGeometries(); i++) {
				const p = mp.getGeometryN(i);
				this.visitInteriorRing(p.getExteriorRing(), graph);
			}
		}
	}
	getCoordinate() {
		return this._disconnectedRingcoord;
	}
	setInteriorEdgesInResult(graph) {
		for (let it = graph.getEdgeEnds().iterator(); it.hasNext();) {
			const de = it.next();
			if (de.getLabel().getLocation(0, Position.RIGHT) === Location.INTERIOR) de.setInResult(true);
		}
	}
	visitLinkedDirectedEdges(start) {
		const startDe = start;
		let de = start;
		do {
			Assert.isTrue(de !== null, "found null Directed Edge");
			de.setVisited(true);
			de = de.getNext();
		} while (de !== startDe);
	}
	buildEdgeRings(dirEdges) {
		const edgeRings = new ArrayList();
		for (let it = dirEdges.iterator(); it.hasNext();) {
			const de = it.next();
			if (de.isInResult() && de.getEdgeRing() === null) {
				const er = new MaximalEdgeRing(de, this._geometryFactory);
				er.linkDirectedEdgesForMinimalEdgeRings();
				const minEdgeRings = er.buildMinimalRings();
				edgeRings.addAll(minEdgeRings);
			}
		}
		return edgeRings;
	}
	hasUnvisitedShellEdge(edgeRings) {
		for (let i = 0; i < edgeRings.size(); i++) {
			const er = edgeRings.get(i);
			if (er.isHole()) continue;
			const edges = er.getEdges();
			let de = edges.get(0);
			if (de.getLabel().getLocation(0, Position.RIGHT) !== Location.INTERIOR) continue;
			for (let j = 0; j < edges.size(); j++) {
				de = edges.get(j);
				if (!de.isVisited()) {
					this._disconnectedRingcoord = de.getCoordinate();
					return true;
				}
			}
		}
		return false;
	}
	isInteriorsConnected() {
		const splitEdges = new ArrayList();
		this._geomGraph.computeSplitEdges(splitEdges);
		const graph = new PlanarGraph(new OverlayNodeFactory());
		graph.addEdges(splitEdges);
		this.setInteriorEdgesInResult(graph);
		graph.linkResultDirectedEdges();
		const edgeRings = this.buildEdgeRings(graph.getEdgeEnds());
		this.visitShellInteriors(this._geomGraph.getGeometry(), graph);
		return !this.hasUnvisitedShellEdge(edgeRings);
	}
};
// node_modules/jsts/org/locationtech/jts/operation/relate/EdgeEndBuilder.js
var EdgeEndBuilder = class {
	computeEdgeEnds() {
		if (arguments.length === 1) {
			const edges = arguments[0];
			const l = new ArrayList();
			for (let i = edges; i.hasNext();) {
				const e = i.next();
				this.computeEdgeEnds(e, l);
			}
			return l;
		} else if (arguments.length === 2) {
			const edge = arguments[0], l = arguments[1];
			const eiList = edge.getEdgeIntersectionList();
			eiList.addEndpoints();
			const it = eiList.iterator();
			let eiPrev = null;
			let eiCurr = null;
			if (!it.hasNext()) return null;
			let eiNext = it.next();
			do {
				eiPrev = eiCurr;
				eiCurr = eiNext;
				eiNext = null;
				if (it.hasNext()) eiNext = it.next();
				if (eiCurr !== null) {
					this.createEdgeEndForPrev(edge, l, eiCurr, eiPrev);
					this.createEdgeEndForNext(edge, l, eiCurr, eiNext);
				}
			} while (eiCurr !== null);
		}
	}
	createEdgeEndForNext(edge, l, eiCurr, eiNext) {
		const iNext = eiCurr.segmentIndex + 1;
		if (iNext >= edge.getNumPoints() && eiNext === null) return null;
		let pNext = edge.getCoordinate(iNext);
		if (eiNext !== null && eiNext.segmentIndex === eiCurr.segmentIndex) pNext = eiNext.coord;
		const e = new EdgeEnd(edge, eiCurr.coord, pNext, new Label(edge.getLabel()));
		l.add(e);
	}
	createEdgeEndForPrev(edge, l, eiCurr, eiPrev) {
		let iPrev = eiCurr.segmentIndex;
		if (eiCurr.dist === 0) {
			if (iPrev === 0) return null;
			iPrev--;
		}
		let pPrev = edge.getCoordinate(iPrev);
		if (eiPrev !== null && eiPrev.segmentIndex >= iPrev) pPrev = eiPrev.coord;
		const label = new Label(edge.getLabel());
		label.flip();
		const e = new EdgeEnd(edge, eiCurr.coord, pPrev, label);
		l.add(e);
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/index/EdgeSetIntersector.js
var EdgeSetIntersector = class {};
// node_modules/jsts/java/util/Collections.js
var Collections = {
	reverseOrder: function() {
		return { compare(a, b) {
			return b.compareTo(a);
		} };
	},
	min: function(l) {
		Collections.sort(l);
		return l.get(0);
	},
	sort: function(l, c) {
		const a = l.toArray();
		if (c) Arrays.sort(a, c);
		else Arrays.sort(a);
		const i = l.iterator();
		for (let pos = 0, alen = a.length; pos < alen; pos++) {
			i.next();
			i.set(a[pos]);
		}
	},
	singletonList: function(o) {
		const arrayList = new ArrayList();
		arrayList.add(o);
		return arrayList;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/index/SegmentIntersector.js
var SegmentIntersector = class SegmentIntersector {
	constructor() {
		SegmentIntersector.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._hasIntersection = false;
		this._hasProper = false;
		this._hasProperInterior = false;
		this._properIntersectionPoint = null;
		this._li = null;
		this._includeProper = null;
		this._recordIsolated = null;
		this._isSelfIntersection = null;
		this._numIntersections = 0;
		this.numTests = 0;
		this._bdyNodes = null;
		this._isDone = false;
		this._isDoneWhenProperInt = false;
		const li = arguments[0], includeProper = arguments[1], recordIsolated = arguments[2];
		this._li = li;
		this._includeProper = includeProper;
		this._recordIsolated = recordIsolated;
	}
	static isAdjacentSegments(i1, i2) {
		return Math.abs(i1 - i2) === 1;
	}
	isTrivialIntersection(e0, segIndex0, e1, segIndex1) {
		if (e0 === e1) {
			if (this._li.getIntersectionNum() === 1) {
				if (SegmentIntersector.isAdjacentSegments(segIndex0, segIndex1)) return true;
				if (e0.isClosed()) {
					const maxSegIndex = e0.getNumPoints() - 1;
					if (segIndex0 === 0 && segIndex1 === maxSegIndex || segIndex1 === 0 && segIndex0 === maxSegIndex) return true;
				}
			}
		}
		return false;
	}
	hasProperInteriorIntersection() {
		return this._hasProperInterior;
	}
	isBoundaryPointInternal(li, bdyNodes) {
		for (let i = bdyNodes.iterator(); i.hasNext();) {
			const pt = i.next().getCoordinate();
			if (li.isIntersection(pt)) return true;
		}
		return false;
	}
	hasProperIntersection() {
		return this._hasProper;
	}
	hasIntersection() {
		return this._hasIntersection;
	}
	isDone() {
		return this._isDone;
	}
	isBoundaryPoint(li, bdyNodes) {
		if (bdyNodes === null) return false;
		if (this.isBoundaryPointInternal(li, bdyNodes[0])) return true;
		if (this.isBoundaryPointInternal(li, bdyNodes[1])) return true;
		return false;
	}
	setBoundaryNodes(bdyNodes0, bdyNodes1) {
		this._bdyNodes = new Array(2).fill(null);
		this._bdyNodes[0] = bdyNodes0;
		this._bdyNodes[1] = bdyNodes1;
	}
	addIntersections(e0, segIndex0, e1, segIndex1) {
		if (e0 === e1 && segIndex0 === segIndex1) return null;
		this.numTests++;
		const p00 = e0.getCoordinates()[segIndex0];
		const p01 = e0.getCoordinates()[segIndex0 + 1];
		const p10 = e1.getCoordinates()[segIndex1];
		const p11 = e1.getCoordinates()[segIndex1 + 1];
		this._li.computeIntersection(p00, p01, p10, p11);
		if (this._li.hasIntersection()) {
			if (this._recordIsolated) {
				e0.setIsolated(false);
				e1.setIsolated(false);
			}
			this._numIntersections++;
			if (!this.isTrivialIntersection(e0, segIndex0, e1, segIndex1)) {
				this._hasIntersection = true;
				if (this._includeProper || !this._li.isProper()) {
					e0.addIntersections(this._li, segIndex0, 0);
					e1.addIntersections(this._li, segIndex1, 1);
				}
				if (this._li.isProper()) {
					this._properIntersectionPoint = this._li.getIntersection(0).copy();
					this._hasProper = true;
					if (this._isDoneWhenProperInt) this._isDone = true;
					if (!this.isBoundaryPoint(this._li, this._bdyNodes)) this._hasProperInterior = true;
				}
			}
		}
	}
	getProperIntersectionPoint() {
		return this._properIntersectionPoint;
	}
	setIsDoneIfProperInt(isDoneWhenProperInt) {
		this._isDoneWhenProperInt = isDoneWhenProperInt;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/index/MonotoneChain.js
var MonotoneChain = class MonotoneChain {
	constructor() {
		MonotoneChain.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.mce = null;
		this.chainIndex = null;
		const mce = arguments[0], chainIndex = arguments[1];
		this.mce = mce;
		this.chainIndex = chainIndex;
	}
	computeIntersections(mc, si) {
		this.mce.computeIntersectsForChain(this.chainIndex, mc.mce, mc.chainIndex, si);
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/index/SweepLineEvent.js
var SweepLineEvent = class SweepLineEvent {
	constructor() {
		SweepLineEvent.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._label = null;
		this._xValue = null;
		this._eventType = null;
		this._insertEvent = null;
		this._deleteEventIndex = null;
		this._obj = null;
		if (arguments.length === 2) {
			const x = arguments[0], insertEvent = arguments[1];
			this._eventType = SweepLineEvent.DELETE;
			this._xValue = x;
			this._insertEvent = insertEvent;
		} else if (arguments.length === 3) {
			const label = arguments[0], x = arguments[1], obj = arguments[2];
			this._eventType = SweepLineEvent.INSERT;
			this._label = label;
			this._xValue = x;
			this._obj = obj;
		}
	}
	getObject() {
		return this._obj;
	}
	getDeleteEventIndex() {
		return this._deleteEventIndex;
	}
	isDelete() {
		return this._eventType === SweepLineEvent.DELETE;
	}
	setDeleteEventIndex(deleteEventIndex) {
		this._deleteEventIndex = deleteEventIndex;
	}
	compareTo(o) {
		const pe = o;
		if (this._xValue < pe._xValue) return -1;
		if (this._xValue > pe._xValue) return 1;
		if (this._eventType < pe._eventType) return -1;
		if (this._eventType > pe._eventType) return 1;
		return 0;
	}
	getInsertEvent() {
		return this._insertEvent;
	}
	isInsert() {
		return this._eventType === SweepLineEvent.INSERT;
	}
	isSameLabel(ev) {
		if (this._label === null) return false;
		return this._label === ev._label;
	}
	get interfaces_() {
		return [Comparable];
	}
};
SweepLineEvent.INSERT = 1;
SweepLineEvent.DELETE = 2;
// node_modules/jsts/org/locationtech/jts/geomgraph/index/SimpleMCSweepLineIntersector.js
var SimpleMCSweepLineIntersector = class SimpleMCSweepLineIntersector extends EdgeSetIntersector {
	constructor() {
		super();
		SimpleMCSweepLineIntersector.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.events = new ArrayList();
		this.nOverlaps = null;
	}
	prepareEvents() {
		Collections.sort(this.events);
		for (let i = 0; i < this.events.size(); i++) {
			const ev = this.events.get(i);
			if (ev.isDelete()) ev.getInsertEvent().setDeleteEventIndex(i);
		}
	}
	computeIntersections() {
		if (arguments.length === 1) {
			const si = arguments[0];
			this.nOverlaps = 0;
			this.prepareEvents();
			for (let i = 0; i < this.events.size(); i++) {
				const ev = this.events.get(i);
				if (ev.isInsert()) this.processOverlaps(i, ev.getDeleteEventIndex(), ev, si);
				if (si.isDone()) break;
			}
		} else if (arguments.length === 3) {
			if (arguments[2] instanceof SegmentIntersector && hasInterface_default(arguments[0], List) && hasInterface_default(arguments[1], List)) {
				const edges0 = arguments[0], edges1 = arguments[1], si = arguments[2];
				this.addEdges(edges0, edges0);
				this.addEdges(edges1, edges1);
				this.computeIntersections(si);
			} else if (typeof arguments[2] === "boolean" && hasInterface_default(arguments[0], List) && arguments[1] instanceof SegmentIntersector) {
				const edges = arguments[0], si = arguments[1];
				if (arguments[2]) this.addEdges(edges, null);
				else this.addEdges(edges);
				this.computeIntersections(si);
			}
		}
	}
	addEdge(edge, edgeSet) {
		const mce = edge.getMonotoneChainEdge();
		const startIndex = mce.getStartIndexes();
		for (let i = 0; i < startIndex.length - 1; i++) {
			const mc = new MonotoneChain(mce, i);
			const insertEvent = new SweepLineEvent(edgeSet, mce.getMinX(i), mc);
			this.events.add(insertEvent);
			this.events.add(new SweepLineEvent(mce.getMaxX(i), insertEvent));
		}
	}
	processOverlaps(start, end, ev0, si) {
		const mc0 = ev0.getObject();
		for (let i = start; i < end; i++) {
			const ev1 = this.events.get(i);
			if (ev1.isInsert()) {
				const mc1 = ev1.getObject();
				if (!ev0.isSameLabel(ev1)) {
					mc0.computeIntersections(mc1, si);
					this.nOverlaps++;
				}
			}
		}
	}
	addEdges() {
		if (arguments.length === 1) {
			const edges = arguments[0];
			for (let i = edges.iterator(); i.hasNext();) {
				const edge = i.next();
				this.addEdge(edge, edge);
			}
		} else if (arguments.length === 2) {
			const edges = arguments[0], edgeSet = arguments[1];
			for (let i = edges.iterator(); i.hasNext();) {
				const edge = i.next();
				this.addEdge(edge, edgeSet);
			}
		}
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/BoundaryNodeRule.js
var BoundaryNodeRule = class {
	isInBoundary(boundaryCount) {}
};
var Mod2BoundaryNodeRule = class {
	isInBoundary(boundaryCount) {
		return boundaryCount % 2 === 1;
	}
	get interfaces_() {
		return [BoundaryNodeRule];
	}
};
var EndPointBoundaryNodeRule = class {
	isInBoundary(boundaryCount) {
		return boundaryCount > 0;
	}
	get interfaces_() {
		return [BoundaryNodeRule];
	}
};
var MultiValentEndPointBoundaryNodeRule = class {
	isInBoundary(boundaryCount) {
		return boundaryCount > 1;
	}
	get interfaces_() {
		return [BoundaryNodeRule];
	}
};
var MonoValentEndPointBoundaryNodeRule = class {
	isInBoundary(boundaryCount) {
		return boundaryCount === 1;
	}
	get interfaces_() {
		return [BoundaryNodeRule];
	}
};
BoundaryNodeRule.Mod2BoundaryNodeRule = Mod2BoundaryNodeRule;
BoundaryNodeRule.EndPointBoundaryNodeRule = EndPointBoundaryNodeRule;
BoundaryNodeRule.MultiValentEndPointBoundaryNodeRule = MultiValentEndPointBoundaryNodeRule;
BoundaryNodeRule.MonoValentEndPointBoundaryNodeRule = MonoValentEndPointBoundaryNodeRule;
BoundaryNodeRule.MOD2_BOUNDARY_RULE = new Mod2BoundaryNodeRule();
BoundaryNodeRule.ENDPOINT_BOUNDARY_RULE = new EndPointBoundaryNodeRule();
BoundaryNodeRule.MULTIVALENT_ENDPOINT_BOUNDARY_RULE = new MultiValentEndPointBoundaryNodeRule();
BoundaryNodeRule.MONOVALENT_ENDPOINT_BOUNDARY_RULE = new MonoValentEndPointBoundaryNodeRule();
BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE = BoundaryNodeRule.MOD2_BOUNDARY_RULE;
// node_modules/jsts/org/locationtech/jts/algorithm/PointLocator.js
var PointLocator = class PointLocator {
	constructor() {
		PointLocator.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._boundaryRule = BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE;
		this._isIn = null;
		this._numBoundaries = null;
		if (arguments.length === 0) {} else if (arguments.length === 1) {
			const boundaryRule = arguments[0];
			if (boundaryRule === null) throw new IllegalArgumentException("Rule must be non-null");
			this._boundaryRule = boundaryRule;
		}
	}
	locateInPolygonRing(p, ring) {
		if (!ring.getEnvelopeInternal().intersects(p)) return Location.EXTERIOR;
		return PointLocation.locateInRing(p, ring.getCoordinates());
	}
	intersects(p, geom) {
		return this.locate(p, geom) !== Location.EXTERIOR;
	}
	updateLocationInfo(loc) {
		if (loc === Location.INTERIOR) this._isIn = true;
		if (loc === Location.BOUNDARY) this._numBoundaries++;
	}
	computeLocation(p, geom) {
		if (geom instanceof Point) this.updateLocationInfo(this.locateOnPoint(p, geom));
		if (geom instanceof LineString) this.updateLocationInfo(this.locateOnLineString(p, geom));
		else if (geom instanceof Polygon) this.updateLocationInfo(this.locateInPolygon(p, geom));
		else if (geom instanceof MultiLineString) {
			const ml = geom;
			for (let i = 0; i < ml.getNumGeometries(); i++) {
				const l = ml.getGeometryN(i);
				this.updateLocationInfo(this.locateOnLineString(p, l));
			}
		} else if (geom instanceof MultiPolygon) {
			const mpoly = geom;
			for (let i = 0; i < mpoly.getNumGeometries(); i++) {
				const poly = mpoly.getGeometryN(i);
				this.updateLocationInfo(this.locateInPolygon(p, poly));
			}
		} else if (geom instanceof GeometryCollection) {
			const geomi = new GeometryCollectionIterator(geom);
			while (geomi.hasNext()) {
				const g2 = geomi.next();
				if (g2 !== geom) this.computeLocation(p, g2);
			}
		}
	}
	locateOnPoint(p, pt) {
		if (pt.getCoordinate().equals2D(p)) return Location.INTERIOR;
		return Location.EXTERIOR;
	}
	locateOnLineString(p, l) {
		if (!l.getEnvelopeInternal().intersects(p)) return Location.EXTERIOR;
		const seq = l.getCoordinateSequence();
		if (!l.isClosed()) {
			if (p.equals(seq.getCoordinate(0)) || p.equals(seq.getCoordinate(seq.size() - 1))) return Location.BOUNDARY;
		}
		if (PointLocation.isOnLine(p, seq)) return Location.INTERIOR;
		return Location.EXTERIOR;
	}
	locateInPolygon(p, poly) {
		if (poly.isEmpty()) return Location.EXTERIOR;
		const shell = poly.getExteriorRing();
		const shellLoc = this.locateInPolygonRing(p, shell);
		if (shellLoc === Location.EXTERIOR) return Location.EXTERIOR;
		if (shellLoc === Location.BOUNDARY) return Location.BOUNDARY;
		for (let i = 0; i < poly.getNumInteriorRing(); i++) {
			const hole = poly.getInteriorRingN(i);
			const holeLoc = this.locateInPolygonRing(p, hole);
			if (holeLoc === Location.INTERIOR) return Location.EXTERIOR;
			if (holeLoc === Location.BOUNDARY) return Location.BOUNDARY;
		}
		return Location.INTERIOR;
	}
	locate(p, geom) {
		if (geom.isEmpty()) return Location.EXTERIOR;
		if (geom instanceof LineString) return this.locateOnLineString(p, geom);
		else if (geom instanceof Polygon) return this.locateInPolygon(p, geom);
		this._isIn = false;
		this._numBoundaries = 0;
		this.computeLocation(p, geom);
		if (this._boundaryRule.isInBoundary(this._numBoundaries)) return Location.BOUNDARY;
		if (this._numBoundaries > 0 || this._isIn) return Location.INTERIOR;
		return Location.EXTERIOR;
	}
};
// node_modules/jsts/org/locationtech/jts/index/ItemVisitor.js
var ItemVisitor = class {
	visitItem(item) {}
};
// node_modules/jsts/org/locationtech/jts/index/intervalrtree/IntervalRTreeNode.js
var IntervalRTreeNode = class IntervalRTreeNode {
	constructor() {
		IntervalRTreeNode.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._min = Double.POSITIVE_INFINITY;
		this._max = Double.NEGATIVE_INFINITY;
	}
	getMin() {
		return this._min;
	}
	intersects(queryMin, queryMax) {
		if (this._min > queryMax || this._max < queryMin) return false;
		return true;
	}
	getMax() {
		return this._max;
	}
	toString() {
		return WKTWriter.toLineString(new Coordinate(this._min, 0), new Coordinate(this._max, 0));
	}
};
var NodeComparator = class {
	compare(o1, o2) {
		const n1 = o1;
		const n2 = o2;
		const mid1 = (n1._min + n1._max) / 2;
		const mid2 = (n2._min + n2._max) / 2;
		if (mid1 < mid2) return -1;
		if (mid1 > mid2) return 1;
		return 0;
	}
	get interfaces_() {
		return [Comparator];
	}
};
IntervalRTreeNode.NodeComparator = NodeComparator;
// node_modules/jsts/org/locationtech/jts/index/intervalrtree/IntervalRTreeLeafNode.js
var IntervalRTreeLeafNode = class IntervalRTreeLeafNode extends IntervalRTreeNode {
	constructor() {
		super();
		IntervalRTreeLeafNode.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._item = null;
		const min = arguments[0], max = arguments[1], item = arguments[2];
		this._min = min;
		this._max = max;
		this._item = item;
	}
	query(queryMin, queryMax, visitor) {
		if (!this.intersects(queryMin, queryMax)) return null;
		visitor.visitItem(this._item);
	}
};
// node_modules/jsts/org/locationtech/jts/index/intervalrtree/IntervalRTreeBranchNode.js
var IntervalRTreeBranchNode = class IntervalRTreeBranchNode extends IntervalRTreeNode {
	constructor() {
		super();
		IntervalRTreeBranchNode.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._node1 = null;
		this._node2 = null;
		const n1 = arguments[0], n2 = arguments[1];
		this._node1 = n1;
		this._node2 = n2;
		this.buildExtent(this._node1, this._node2);
	}
	buildExtent(n1, n2) {
		this._min = Math.min(n1._min, n2._min);
		this._max = Math.max(n1._max, n2._max);
	}
	query(queryMin, queryMax, visitor) {
		if (!this.intersects(queryMin, queryMax)) return null;
		if (this._node1 !== null) this._node1.query(queryMin, queryMax, visitor);
		if (this._node2 !== null) this._node2.query(queryMin, queryMax, visitor);
	}
};
// node_modules/jsts/org/locationtech/jts/index/intervalrtree/SortedPackedIntervalRTree.js
var SortedPackedIntervalRTree = class SortedPackedIntervalRTree {
	constructor() {
		SortedPackedIntervalRTree.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._leaves = new ArrayList();
		this._root = null;
		this._level = 0;
	}
	buildTree() {
		Collections.sort(this._leaves, new IntervalRTreeNode.NodeComparator());
		let src = this._leaves;
		let temp = null;
		let dest = new ArrayList();
		while (true) {
			this.buildLevel(src, dest);
			if (dest.size() === 1) return dest.get(0);
			temp = src;
			src = dest;
			dest = temp;
		}
	}
	insert(min, max, item) {
		if (this._root !== null) throw new IllegalStateException("Index cannot be added to once it has been queried");
		this._leaves.add(new IntervalRTreeLeafNode(min, max, item));
	}
	query(min, max, visitor) {
		this.init();
		if (this._root === null) return null;
		this._root.query(min, max, visitor);
	}
	buildRoot() {
		if (this._root !== null) return null;
		this._root = this.buildTree();
	}
	printNode(node) {
		System.out.println(WKTWriter.toLineString(new Coordinate(node._min, this._level), new Coordinate(node._max, this._level)));
	}
	init() {
		if (this._root !== null) return null;
		if (this._leaves.size() === 0) return null;
		this.buildRoot();
	}
	buildLevel(src, dest) {
		this._level++;
		dest.clear();
		for (let i = 0; i < src.size(); i += 2) {
			const n1 = src.get(i);
			if ((i + 1 < src.size() ? src.get(i) : null) === null) dest.add(n1);
			else {
				const node = new IntervalRTreeBranchNode(src.get(i), src.get(i + 1));
				dest.add(node);
			}
		}
	}
};
// node_modules/jsts/org/locationtech/jts/geom/LineSegment.js
var LineSegment = class LineSegment {
	constructor() {
		LineSegment.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.p0 = null;
		this.p1 = null;
		if (arguments.length === 0) LineSegment.constructor_.call(this, new Coordinate(), new Coordinate());
		else if (arguments.length === 1) {
			const ls = arguments[0];
			LineSegment.constructor_.call(this, ls.p0, ls.p1);
		} else if (arguments.length === 2) {
			const p0 = arguments[0], p1 = arguments[1];
			this.p0 = p0;
			this.p1 = p1;
		} else if (arguments.length === 4) {
			const x0 = arguments[0], y0 = arguments[1], x1 = arguments[2], y1 = arguments[3];
			LineSegment.constructor_.call(this, new Coordinate(x0, y0), new Coordinate(x1, y1));
		}
	}
	static midPoint(p0, p1) {
		return new Coordinate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
	}
	minX() {
		return Math.min(this.p0.x, this.p1.x);
	}
	orientationIndex() {
		if (arguments[0] instanceof LineSegment) {
			const seg = arguments[0];
			const orient0 = Orientation.index(this.p0, this.p1, seg.p0);
			const orient1 = Orientation.index(this.p0, this.p1, seg.p1);
			if (orient0 >= 0 && orient1 >= 0) return Math.max(orient0, orient1);
			if (orient0 <= 0 && orient1 <= 0) return Math.max(orient0, orient1);
			return 0;
		} else if (arguments[0] instanceof Coordinate) {
			const p = arguments[0];
			return Orientation.index(this.p0, this.p1, p);
		}
	}
	toGeometry(geomFactory) {
		return geomFactory.createLineString([this.p0, this.p1]);
	}
	isVertical() {
		return this.p0.x === this.p1.x;
	}
	minY() {
		return Math.min(this.p0.y, this.p1.y);
	}
	midPoint() {
		return LineSegment.midPoint(this.p0, this.p1);
	}
	maxY() {
		return Math.max(this.p0.y, this.p1.y);
	}
	pointAlongOffset(segmentLengthFraction, offsetDistance) {
		const segx = this.p0.x + segmentLengthFraction * (this.p1.x - this.p0.x);
		const segy = this.p0.y + segmentLengthFraction * (this.p1.y - this.p0.y);
		const dx = this.p1.x - this.p0.x;
		const dy = this.p1.y - this.p0.y;
		const len = Math.sqrt(dx * dx + dy * dy);
		let ux = 0;
		let uy = 0;
		if (offsetDistance !== 0) {
			if (len <= 0) throw new IllegalStateException("Cannot compute offset from zero-length line segment");
			ux = offsetDistance * dx / len;
			uy = offsetDistance * dy / len;
		}
		return new Coordinate(segx - uy, segy + ux);
	}
	setCoordinates() {
		if (arguments.length === 1) {
			const ls = arguments[0];
			this.setCoordinates(ls.p0, ls.p1);
		} else if (arguments.length === 2) {
			const p0 = arguments[0], p1 = arguments[1];
			this.p0.x = p0.x;
			this.p0.y = p0.y;
			this.p1.x = p1.x;
			this.p1.y = p1.y;
		}
	}
	segmentFraction(inputPt) {
		let segFrac = this.projectionFactor(inputPt);
		if (segFrac < 0) segFrac = 0;
		else if (segFrac > 1 || Double.isNaN(segFrac)) segFrac = 1;
		return segFrac;
	}
	toString() {
		return "LINESTRING( " + this.p0.x + " " + this.p0.y + ", " + this.p1.x + " " + this.p1.y + ")";
	}
	distance() {
		if (arguments[0] instanceof LineSegment) {
			const ls = arguments[0];
			return Distance.segmentToSegment(this.p0, this.p1, ls.p0, ls.p1);
		} else if (arguments[0] instanceof Coordinate) {
			const p = arguments[0];
			return Distance.pointToSegment(p, this.p0, this.p1);
		}
	}
	equals(o) {
		if (!(o instanceof LineSegment)) return false;
		const other = o;
		return this.p0.equals(other.p0) && this.p1.equals(other.p1);
	}
	intersection(line) {
		const li = new RobustLineIntersector();
		li.computeIntersection(this.p0, this.p1, line.p0, line.p1);
		if (li.hasIntersection()) return li.getIntersection(0);
		return null;
	}
	project() {
		if (arguments[0] instanceof Coordinate) {
			const p = arguments[0];
			if (p.equals(this.p0) || p.equals(this.p1)) return new Coordinate(p);
			const r = this.projectionFactor(p);
			const coord = new Coordinate();
			coord.x = this.p0.x + r * (this.p1.x - this.p0.x);
			coord.y = this.p0.y + r * (this.p1.y - this.p0.y);
			return coord;
		} else if (arguments[0] instanceof LineSegment) {
			const seg = arguments[0];
			const pf0 = this.projectionFactor(seg.p0);
			const pf1 = this.projectionFactor(seg.p1);
			if (pf0 >= 1 && pf1 >= 1) return null;
			if (pf0 <= 0 && pf1 <= 0) return null;
			let newp0 = this.project(seg.p0);
			if (pf0 < 0) newp0 = this.p0;
			if (pf0 > 1) newp0 = this.p1;
			let newp1 = this.project(seg.p1);
			if (pf1 < 0) newp1 = this.p0;
			if (pf1 > 1) newp1 = this.p1;
			return new LineSegment(newp0, newp1);
		}
	}
	normalize() {
		if (this.p1.compareTo(this.p0) < 0) this.reverse();
	}
	angle() {
		return Math.atan2(this.p1.y - this.p0.y, this.p1.x - this.p0.x);
	}
	getCoordinate(i) {
		if (i === 0) return this.p0;
		return this.p1;
	}
	distancePerpendicular(p) {
		return Distance.pointToLinePerpendicular(p, this.p0, this.p1);
	}
	closestPoint(p) {
		const factor = this.projectionFactor(p);
		if (factor > 0 && factor < 1) return this.project(p);
		if (this.p0.distance(p) < this.p1.distance(p)) return this.p0;
		return this.p1;
	}
	projectionFactor(p) {
		if (p.equals(this.p0)) return 0;
		if (p.equals(this.p1)) return 1;
		const dx = this.p1.x - this.p0.x;
		const dy = this.p1.y - this.p0.y;
		const len = dx * dx + dy * dy;
		if (len <= 0) return Double.NaN;
		return ((p.x - this.p0.x) * dx + (p.y - this.p0.y) * dy) / len;
	}
	closestPoints(line) {
		const intPt = this.intersection(line);
		if (intPt !== null) return [intPt, intPt];
		const closestPt = new Array(2).fill(null);
		let minDistance = Double.MAX_VALUE;
		let dist = null;
		const close00 = this.closestPoint(line.p0);
		minDistance = close00.distance(line.p0);
		closestPt[0] = close00;
		closestPt[1] = line.p0;
		const close01 = this.closestPoint(line.p1);
		dist = close01.distance(line.p1);
		if (dist < minDistance) {
			minDistance = dist;
			closestPt[0] = close01;
			closestPt[1] = line.p1;
		}
		const close10 = line.closestPoint(this.p0);
		dist = close10.distance(this.p0);
		if (dist < minDistance) {
			minDistance = dist;
			closestPt[0] = this.p0;
			closestPt[1] = close10;
		}
		const close11 = line.closestPoint(this.p1);
		dist = close11.distance(this.p1);
		if (dist < minDistance) {
			minDistance = dist;
			closestPt[0] = this.p1;
			closestPt[1] = close11;
		}
		return closestPt;
	}
	maxX() {
		return Math.max(this.p0.x, this.p1.x);
	}
	getLength() {
		return this.p0.distance(this.p1);
	}
	compareTo(o) {
		const other = o;
		const comp0 = this.p0.compareTo(other.p0);
		if (comp0 !== 0) return comp0;
		return this.p1.compareTo(other.p1);
	}
	reverse() {
		const temp = this.p0;
		this.p0 = this.p1;
		this.p1 = temp;
	}
	equalsTopo(other) {
		return this.p0.equals(other.p0) && this.p1.equals(other.p1) || this.p0.equals(other.p1) && this.p1.equals(other.p0);
	}
	lineIntersection(line) {
		return Intersection.intersection(this.p0, this.p1, line.p0, line.p1);
	}
	isHorizontal() {
		return this.p0.y === this.p1.y;
	}
	reflect(p) {
		const A = this.p1.getY() - this.p0.getY();
		const B = this.p0.getX() - this.p1.getX();
		const C = this.p0.getY() * (this.p1.getX() - this.p0.getX()) - this.p0.getX() * (this.p1.getY() - this.p0.getY());
		const A2plusB2 = A * A + B * B;
		const A2subB2 = A * A - B * B;
		const x = p.getX();
		const y = p.getY();
		return new Coordinate((-A2subB2 * x - 2 * A * B * y - 2 * A * C) / A2plusB2, (A2subB2 * y - 2 * A * B * x - 2 * B * C) / A2plusB2);
	}
	pointAlong(segmentLengthFraction) {
		const coord = new Coordinate();
		coord.x = this.p0.x + segmentLengthFraction * (this.p1.x - this.p0.x);
		coord.y = this.p0.y + segmentLengthFraction * (this.p1.y - this.p0.y);
		return coord;
	}
	hashCode() {
		let bits0 = Double.doubleToLongBits(this.p0.x);
		bits0 ^= Double.doubleToLongBits(this.p0.y) * 31;
		const hash0 = Math.trunc(bits0) ^ Math.trunc(bits0 >> 32);
		let bits1 = Double.doubleToLongBits(this.p1.x);
		bits1 ^= Double.doubleToLongBits(this.p1.y) * 31;
		return hash0 ^ (Math.trunc(bits1) ^ Math.trunc(bits1 >> 32));
	}
	get interfaces_() {
		return [Comparable, Serializable];
	}
};
// node_modules/jsts/org/locationtech/jts/geom/util/LinearComponentExtracter.js
var LinearComponentExtracter = class LinearComponentExtracter {
	constructor() {
		LinearComponentExtracter.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._lines = null;
		this._isForcedToLineString = false;
		if (arguments.length === 1) {
			const lines = arguments[0];
			this._lines = lines;
		} else if (arguments.length === 2) {
			const lines = arguments[0], isForcedToLineString = arguments[1];
			this._lines = lines;
			this._isForcedToLineString = isForcedToLineString;
		}
	}
	static getLines() {
		if (arguments.length === 1) {
			const geom = arguments[0];
			return LinearComponentExtracter.getLines(geom, false);
		} else if (arguments.length === 2) {
			if (hasInterface_default(arguments[0], Collection) && hasInterface_default(arguments[1], Collection)) {
				const geoms = arguments[0], lines = arguments[1];
				for (let i = geoms.iterator(); i.hasNext();) {
					const g = i.next();
					LinearComponentExtracter.getLines(g, lines);
				}
				return lines;
			} else if (arguments[0] instanceof Geometry && typeof arguments[1] === "boolean") {
				const geom = arguments[0], forceToLineString = arguments[1];
				const lines = new ArrayList();
				geom.apply(new LinearComponentExtracter(lines, forceToLineString));
				return lines;
			} else if (arguments[0] instanceof Geometry && hasInterface_default(arguments[1], Collection)) {
				const geom = arguments[0], lines = arguments[1];
				if (geom instanceof LineString) lines.add(geom);
				else geom.apply(new LinearComponentExtracter(lines));
				return lines;
			}
		} else if (arguments.length === 3) {
			if (typeof arguments[2] === "boolean" && hasInterface_default(arguments[0], Collection) && hasInterface_default(arguments[1], Collection)) {
				const geoms = arguments[0], lines = arguments[1], forceToLineString = arguments[2];
				for (let i = geoms.iterator(); i.hasNext();) {
					const g = i.next();
					LinearComponentExtracter.getLines(g, lines, forceToLineString);
				}
				return lines;
			} else if (typeof arguments[2] === "boolean" && arguments[0] instanceof Geometry && hasInterface_default(arguments[1], Collection)) {
				const geom = arguments[0], lines = arguments[1], forceToLineString = arguments[2];
				geom.apply(new LinearComponentExtracter(lines, forceToLineString));
				return lines;
			}
		}
	}
	static getGeometry() {
		if (arguments.length === 1) {
			const geom = arguments[0];
			return geom.getFactory().buildGeometry(LinearComponentExtracter.getLines(geom));
		} else if (arguments.length === 2) {
			const geom = arguments[0], forceToLineString = arguments[1];
			return geom.getFactory().buildGeometry(LinearComponentExtracter.getLines(geom, forceToLineString));
		}
	}
	filter(geom) {
		if (this._isForcedToLineString && geom instanceof LinearRing) {
			const line = geom.getFactory().createLineString(geom.getCoordinateSequence());
			this._lines.add(line);
			return null;
		}
		if (geom instanceof LineString) this._lines.add(geom);
	}
	setForceToLineString(isForcedToLineString) {
		this._isForcedToLineString = isForcedToLineString;
	}
	get interfaces_() {
		return [GeometryComponentFilter];
	}
};
// node_modules/jsts/org/locationtech/jts/index/ArrayListVisitor.js
var ArrayListVisitor = class ArrayListVisitor {
	constructor() {
		ArrayListVisitor.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._items = new ArrayList();
	}
	getItems() {
		return this._items;
	}
	visitItem(item) {
		this._items.add(item);
	}
	get interfaces_() {
		return [ItemVisitor];
	}
};
// node_modules/jsts/org/locationtech/jts/algorithm/locate/IndexedPointInAreaLocator.js
var IndexedPointInAreaLocator = class IndexedPointInAreaLocator {
	constructor() {
		IndexedPointInAreaLocator.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._geom = null;
		this._index = null;
		const g = arguments[0];
		if (!(hasInterface_default(g, Polygonal) || g instanceof LinearRing)) throw new IllegalArgumentException("Argument must be Polygonal or LinearRing");
		this._geom = g;
	}
	locate(p) {
		if (this._index === null) {
			this._index = new IntervalIndexedGeometry(this._geom);
			this._geom = null;
		}
		const rcc = new RayCrossingCounter(p);
		const visitor = new SegmentVisitor(rcc);
		this._index.query(p.y, p.y, visitor);
		return rcc.getLocation();
	}
	get interfaces_() {
		return [PointOnGeometryLocator];
	}
};
var SegmentVisitor = class SegmentVisitor {
	constructor() {
		SegmentVisitor.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._counter = null;
		const counter = arguments[0];
		this._counter = counter;
	}
	visitItem(item) {
		const seg = item;
		this._counter.countSegment(seg.getCoordinate(0), seg.getCoordinate(1));
	}
	get interfaces_() {
		return [ItemVisitor];
	}
};
var IntervalIndexedGeometry = class IntervalIndexedGeometry {
	constructor() {
		IntervalIndexedGeometry.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._isEmpty = false;
		this._index = new SortedPackedIntervalRTree();
		const geom = arguments[0];
		if (geom.isEmpty()) this._isEmpty = true;
		else this.init(geom);
	}
	init(geom) {
		const lines = LinearComponentExtracter.getLines(geom);
		for (let i = lines.iterator(); i.hasNext();) {
			const pts = i.next().getCoordinates();
			this.addLine(pts);
		}
	}
	addLine(pts) {
		for (let i = 1; i < pts.length; i++) {
			const seg = new LineSegment(pts[i - 1], pts[i]);
			const min = Math.min(seg.p0.y, seg.p1.y);
			const max = Math.max(seg.p0.y, seg.p1.y);
			this._index.insert(min, max, seg);
		}
	}
	query() {
		if (arguments.length === 2) {
			const min = arguments[0], max = arguments[1];
			if (this._isEmpty) return new ArrayList();
			const visitor = new ArrayListVisitor();
			this._index.query(min, max, visitor);
			return visitor.getItems();
		} else if (arguments.length === 3) {
			const min = arguments[0], max = arguments[1], visitor = arguments[2];
			if (this._isEmpty) return null;
			this._index.query(min, max, visitor);
		}
	}
};
IndexedPointInAreaLocator.SegmentVisitor = SegmentVisitor;
IndexedPointInAreaLocator.IntervalIndexedGeometry = IntervalIndexedGeometry;
// node_modules/jsts/org/locationtech/jts/geomgraph/EdgeIntersection.js
var EdgeIntersection = class EdgeIntersection {
	constructor() {
		EdgeIntersection.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.coord = null;
		this.segmentIndex = null;
		this.dist = null;
		const coord = arguments[0], segmentIndex = arguments[1], dist = arguments[2];
		this.coord = new Coordinate(coord);
		this.segmentIndex = segmentIndex;
		this.dist = dist;
	}
	getSegmentIndex() {
		return this.segmentIndex;
	}
	getCoordinate() {
		return this.coord;
	}
	print(out) {
		out.print(this.coord);
		out.print(" seg # = " + this.segmentIndex);
		out.println(" dist = " + this.dist);
	}
	compareTo(obj) {
		const other = obj;
		return this.compare(other.segmentIndex, other.dist);
	}
	isEndPoint(maxSegmentIndex) {
		if (this.segmentIndex === 0 && this.dist === 0) return true;
		if (this.segmentIndex === maxSegmentIndex) return true;
		return false;
	}
	toString() {
		return this.coord + " seg # = " + this.segmentIndex + " dist = " + this.dist;
	}
	getDistance() {
		return this.dist;
	}
	compare(segmentIndex, dist) {
		if (this.segmentIndex < segmentIndex) return -1;
		if (this.segmentIndex > segmentIndex) return 1;
		if (this.dist < dist) return -1;
		if (this.dist > dist) return 1;
		return 0;
	}
	get interfaces_() {
		return [Comparable];
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/EdgeIntersectionList.js
var EdgeIntersectionList = class EdgeIntersectionList {
	constructor() {
		EdgeIntersectionList.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._nodeMap = new TreeMap();
		this.edge = null;
		const edge = arguments[0];
		this.edge = edge;
	}
	print(out) {
		out.println("Intersections:");
		for (let it = this.iterator(); it.hasNext();) it.next().print(out);
	}
	addEndpoints() {
		const maxSegIndex = this.edge.pts.length - 1;
		this.add(this.edge.pts[0], 0, 0);
		this.add(this.edge.pts[maxSegIndex], maxSegIndex, 0);
	}
	createSplitEdge(ei0, ei1) {
		let npts = ei1.segmentIndex - ei0.segmentIndex + 2;
		const lastSegStartPt = this.edge.pts[ei1.segmentIndex];
		const useIntPt1 = ei1.dist > 0 || !ei1.coord.equals2D(lastSegStartPt);
		if (!useIntPt1) npts--;
		const pts = new Array(npts).fill(null);
		let ipt = 0;
		pts[ipt++] = new Coordinate(ei0.coord);
		for (let i = ei0.segmentIndex + 1; i <= ei1.segmentIndex; i++) pts[ipt++] = this.edge.pts[i];
		if (useIntPt1) pts[ipt] = ei1.coord;
		return new Edge(pts, new Label(this.edge._label));
	}
	add(intPt, segmentIndex, dist) {
		const eiNew = new EdgeIntersection(intPt, segmentIndex, dist);
		const ei = this._nodeMap.get(eiNew);
		if (ei !== null) return ei;
		this._nodeMap.put(eiNew, eiNew);
		return eiNew;
	}
	isIntersection(pt) {
		for (let it = this.iterator(); it.hasNext();) if (it.next().coord.equals(pt)) return true;
		return false;
	}
	iterator() {
		return this._nodeMap.values().iterator();
	}
	addSplitEdges(edgeList) {
		this.addEndpoints();
		const it = this.iterator();
		let eiPrev = it.next();
		while (it.hasNext()) {
			const ei = it.next();
			const newEdge = this.createSplitEdge(eiPrev, ei);
			edgeList.add(newEdge);
			eiPrev = ei;
		}
	}
};
// node_modules/jsts/org/locationtech/jts/geom/IntersectionMatrix.js
var IntersectionMatrix = class IntersectionMatrix {
	constructor() {
		IntersectionMatrix.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._matrix = null;
		if (arguments.length === 0) {
			this._matrix = Array(3).fill().map(() => Array(3));
			this.setAll(Dimension.FALSE);
		} else if (arguments.length === 1) {
			if (typeof arguments[0] === "string") {
				const elements = arguments[0];
				IntersectionMatrix.constructor_.call(this);
				this.set(elements);
			} else if (arguments[0] instanceof IntersectionMatrix) {
				const other = arguments[0];
				IntersectionMatrix.constructor_.call(this);
				this._matrix[Location.INTERIOR][Location.INTERIOR] = other._matrix[Location.INTERIOR][Location.INTERIOR];
				this._matrix[Location.INTERIOR][Location.BOUNDARY] = other._matrix[Location.INTERIOR][Location.BOUNDARY];
				this._matrix[Location.INTERIOR][Location.EXTERIOR] = other._matrix[Location.INTERIOR][Location.EXTERIOR];
				this._matrix[Location.BOUNDARY][Location.INTERIOR] = other._matrix[Location.BOUNDARY][Location.INTERIOR];
				this._matrix[Location.BOUNDARY][Location.BOUNDARY] = other._matrix[Location.BOUNDARY][Location.BOUNDARY];
				this._matrix[Location.BOUNDARY][Location.EXTERIOR] = other._matrix[Location.BOUNDARY][Location.EXTERIOR];
				this._matrix[Location.EXTERIOR][Location.INTERIOR] = other._matrix[Location.EXTERIOR][Location.INTERIOR];
				this._matrix[Location.EXTERIOR][Location.BOUNDARY] = other._matrix[Location.EXTERIOR][Location.BOUNDARY];
				this._matrix[Location.EXTERIOR][Location.EXTERIOR] = other._matrix[Location.EXTERIOR][Location.EXTERIOR];
			}
		}
	}
	static isTrue(actualDimensionValue) {
		if (actualDimensionValue >= 0 || actualDimensionValue === Dimension.TRUE) return true;
		return false;
	}
	static matches() {
		if (Number.isInteger(arguments[0]) && typeof arguments[1] === "string") {
			const actualDimensionValue = arguments[0], requiredDimensionSymbol = arguments[1];
			if (requiredDimensionSymbol === Dimension.SYM_DONTCARE) return true;
			if (requiredDimensionSymbol === Dimension.SYM_TRUE && (actualDimensionValue >= 0 || actualDimensionValue === Dimension.TRUE)) return true;
			if (requiredDimensionSymbol === Dimension.SYM_FALSE && actualDimensionValue === Dimension.FALSE) return true;
			if (requiredDimensionSymbol === Dimension.SYM_P && actualDimensionValue === Dimension.P) return true;
			if (requiredDimensionSymbol === Dimension.SYM_L && actualDimensionValue === Dimension.L) return true;
			if (requiredDimensionSymbol === Dimension.SYM_A && actualDimensionValue === Dimension.A) return true;
			return false;
		} else if (typeof arguments[0] === "string" && typeof arguments[1] === "string") {
			const actualDimensionSymbols = arguments[0], requiredDimensionSymbols = arguments[1];
			return new IntersectionMatrix(actualDimensionSymbols).matches(requiredDimensionSymbols);
		}
	}
	isIntersects() {
		return !this.isDisjoint();
	}
	set() {
		if (arguments.length === 1) {
			const dimensionSymbols = arguments[0];
			for (let i = 0; i < dimensionSymbols.length; i++) {
				const row = Math.trunc(i / 3);
				const col = i % 3;
				this._matrix[row][col] = Dimension.toDimensionValue(dimensionSymbols.charAt(i));
			}
		} else if (arguments.length === 3) {
			const row = arguments[0], column = arguments[1], dimensionValue = arguments[2];
			this._matrix[row][column] = dimensionValue;
		}
	}
	isContains() {
		return IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) && this._matrix[Location.EXTERIOR][Location.INTERIOR] === Dimension.FALSE && this._matrix[Location.EXTERIOR][Location.BOUNDARY] === Dimension.FALSE;
	}
	isWithin() {
		return IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) && this._matrix[Location.INTERIOR][Location.EXTERIOR] === Dimension.FALSE && this._matrix[Location.BOUNDARY][Location.EXTERIOR] === Dimension.FALSE;
	}
	isTouches(dimensionOfGeometryA, dimensionOfGeometryB) {
		if (dimensionOfGeometryA > dimensionOfGeometryB) return this.isTouches(dimensionOfGeometryB, dimensionOfGeometryA);
		if (dimensionOfGeometryA === Dimension.A && dimensionOfGeometryB === Dimension.A || dimensionOfGeometryA === Dimension.L && dimensionOfGeometryB === Dimension.L || dimensionOfGeometryA === Dimension.L && dimensionOfGeometryB === Dimension.A || dimensionOfGeometryA === Dimension.P && dimensionOfGeometryB === Dimension.A || dimensionOfGeometryA === Dimension.P && dimensionOfGeometryB === Dimension.L) return this._matrix[Location.INTERIOR][Location.INTERIOR] === Dimension.FALSE && (IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.BOUNDARY]) || IntersectionMatrix.isTrue(this._matrix[Location.BOUNDARY][Location.INTERIOR]) || IntersectionMatrix.isTrue(this._matrix[Location.BOUNDARY][Location.BOUNDARY]));
		return false;
	}
	isOverlaps(dimensionOfGeometryA, dimensionOfGeometryB) {
		if (dimensionOfGeometryA === Dimension.P && dimensionOfGeometryB === Dimension.P || dimensionOfGeometryA === Dimension.A && dimensionOfGeometryB === Dimension.A) return IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) && IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.EXTERIOR]) && IntersectionMatrix.isTrue(this._matrix[Location.EXTERIOR][Location.INTERIOR]);
		if (dimensionOfGeometryA === Dimension.L && dimensionOfGeometryB === Dimension.L) return this._matrix[Location.INTERIOR][Location.INTERIOR] === 1 && IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.EXTERIOR]) && IntersectionMatrix.isTrue(this._matrix[Location.EXTERIOR][Location.INTERIOR]);
		return false;
	}
	isEquals(dimensionOfGeometryA, dimensionOfGeometryB) {
		if (dimensionOfGeometryA !== dimensionOfGeometryB) return false;
		return IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) && this._matrix[Location.INTERIOR][Location.EXTERIOR] === Dimension.FALSE && this._matrix[Location.BOUNDARY][Location.EXTERIOR] === Dimension.FALSE && this._matrix[Location.EXTERIOR][Location.INTERIOR] === Dimension.FALSE && this._matrix[Location.EXTERIOR][Location.BOUNDARY] === Dimension.FALSE;
	}
	matches(requiredDimensionSymbols) {
		if (requiredDimensionSymbols.length !== 9) throw new IllegalArgumentException("Should be length 9: " + requiredDimensionSymbols);
		for (let ai = 0; ai < 3; ai++) for (let bi = 0; bi < 3; bi++) if (!IntersectionMatrix.matches(this._matrix[ai][bi], requiredDimensionSymbols.charAt(3 * ai + bi))) return false;
		return true;
	}
	add(im) {
		for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) this.setAtLeast(i, j, im.get(i, j));
	}
	isDisjoint() {
		return this._matrix[Location.INTERIOR][Location.INTERIOR] === Dimension.FALSE && this._matrix[Location.INTERIOR][Location.BOUNDARY] === Dimension.FALSE && this._matrix[Location.BOUNDARY][Location.INTERIOR] === Dimension.FALSE && this._matrix[Location.BOUNDARY][Location.BOUNDARY] === Dimension.FALSE;
	}
	isCrosses(dimensionOfGeometryA, dimensionOfGeometryB) {
		if (dimensionOfGeometryA === Dimension.P && dimensionOfGeometryB === Dimension.L || dimensionOfGeometryA === Dimension.P && dimensionOfGeometryB === Dimension.A || dimensionOfGeometryA === Dimension.L && dimensionOfGeometryB === Dimension.A) return IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) && IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.EXTERIOR]);
		if (dimensionOfGeometryA === Dimension.L && dimensionOfGeometryB === Dimension.P || dimensionOfGeometryA === Dimension.A && dimensionOfGeometryB === Dimension.P || dimensionOfGeometryA === Dimension.A && dimensionOfGeometryB === Dimension.L) return IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) && IntersectionMatrix.isTrue(this._matrix[Location.EXTERIOR][Location.INTERIOR]);
		if (dimensionOfGeometryA === Dimension.L && dimensionOfGeometryB === Dimension.L) return this._matrix[Location.INTERIOR][Location.INTERIOR] === 0;
		return false;
	}
	isCovers() {
		return (IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) || IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.BOUNDARY]) || IntersectionMatrix.isTrue(this._matrix[Location.BOUNDARY][Location.INTERIOR]) || IntersectionMatrix.isTrue(this._matrix[Location.BOUNDARY][Location.BOUNDARY])) && this._matrix[Location.EXTERIOR][Location.INTERIOR] === Dimension.FALSE && this._matrix[Location.EXTERIOR][Location.BOUNDARY] === Dimension.FALSE;
	}
	isCoveredBy() {
		return (IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.INTERIOR]) || IntersectionMatrix.isTrue(this._matrix[Location.INTERIOR][Location.BOUNDARY]) || IntersectionMatrix.isTrue(this._matrix[Location.BOUNDARY][Location.INTERIOR]) || IntersectionMatrix.isTrue(this._matrix[Location.BOUNDARY][Location.BOUNDARY])) && this._matrix[Location.INTERIOR][Location.EXTERIOR] === Dimension.FALSE && this._matrix[Location.BOUNDARY][Location.EXTERIOR] === Dimension.FALSE;
	}
	setAtLeast() {
		if (arguments.length === 1) {
			const minimumDimensionSymbols = arguments[0];
			for (let i = 0; i < minimumDimensionSymbols.length; i++) {
				const row = Math.trunc(i / 3);
				const col = i % 3;
				this.setAtLeast(row, col, Dimension.toDimensionValue(minimumDimensionSymbols.charAt(i)));
			}
		} else if (arguments.length === 3) {
			const row = arguments[0], column = arguments[1], minimumDimensionValue = arguments[2];
			if (this._matrix[row][column] < minimumDimensionValue) this._matrix[row][column] = minimumDimensionValue;
		}
	}
	setAtLeastIfValid(row, column, minimumDimensionValue) {
		if (row >= 0 && column >= 0) this.setAtLeast(row, column, minimumDimensionValue);
	}
	toString() {
		const builder = new StringBuilder("123456789");
		for (let ai = 0; ai < 3; ai++) for (let bi = 0; bi < 3; bi++) builder.setCharAt(3 * ai + bi, Dimension.toDimensionSymbol(this._matrix[ai][bi]));
		return builder.toString();
	}
	setAll(dimensionValue) {
		for (let ai = 0; ai < 3; ai++) for (let bi = 0; bi < 3; bi++) this._matrix[ai][bi] = dimensionValue;
	}
	get(row, column) {
		return this._matrix[row][column];
	}
	transpose() {
		let temp = this._matrix[1][0];
		this._matrix[1][0] = this._matrix[0][1];
		this._matrix[0][1] = temp;
		temp = this._matrix[2][0];
		this._matrix[2][0] = this._matrix[0][2];
		this._matrix[0][2] = temp;
		temp = this._matrix[2][1];
		this._matrix[2][1] = this._matrix[1][2];
		this._matrix[1][2] = temp;
		return this;
	}
	get interfaces_() {
		return [Clonable];
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/Depth.js
var Depth = class Depth {
	constructor() {
		Depth.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._depth = Array(2).fill().map(() => Array(3));
		for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) this._depth[i][j] = Depth.NULL_VALUE;
	}
	static depthAtLocation(location) {
		if (location === Location.EXTERIOR) return 0;
		if (location === Location.INTERIOR) return 1;
		return Depth.NULL_VALUE;
	}
	getDepth(geomIndex, posIndex) {
		return this._depth[geomIndex][posIndex];
	}
	setDepth(geomIndex, posIndex, depthValue) {
		this._depth[geomIndex][posIndex] = depthValue;
	}
	isNull() {
		if (arguments.length === 0) {
			for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) if (this._depth[i][j] !== Depth.NULL_VALUE) return false;
			return true;
		} else if (arguments.length === 1) {
			const geomIndex = arguments[0];
			return this._depth[geomIndex][1] === Depth.NULL_VALUE;
		} else if (arguments.length === 2) {
			const geomIndex = arguments[0], posIndex = arguments[1];
			return this._depth[geomIndex][posIndex] === Depth.NULL_VALUE;
		}
	}
	normalize() {
		for (let i = 0; i < 2; i++) if (!this.isNull(i)) {
			let minDepth = this._depth[i][1];
			if (this._depth[i][2] < minDepth) minDepth = this._depth[i][2];
			if (minDepth < 0) minDepth = 0;
			for (let j = 1; j < 3; j++) {
				let newValue = 0;
				if (this._depth[i][j] > minDepth) newValue = 1;
				this._depth[i][j] = newValue;
			}
		}
	}
	getDelta(geomIndex) {
		return this._depth[geomIndex][Position.RIGHT] - this._depth[geomIndex][Position.LEFT];
	}
	getLocation(geomIndex, posIndex) {
		if (this._depth[geomIndex][posIndex] <= 0) return Location.EXTERIOR;
		return Location.INTERIOR;
	}
	toString() {
		return "A: " + this._depth[0][1] + "," + this._depth[0][2] + " B: " + this._depth[1][1] + "," + this._depth[1][2];
	}
	add() {
		if (arguments.length === 1) {
			const lbl = arguments[0];
			for (let i = 0; i < 2; i++) for (let j = 1; j < 3; j++) {
				const loc = lbl.getLocation(i, j);
				if (loc === Location.EXTERIOR || loc === Location.INTERIOR) if (this.isNull(i, j)) this._depth[i][j] = Depth.depthAtLocation(loc);
				else this._depth[i][j] += Depth.depthAtLocation(loc);
			}
		} else if (arguments.length === 3) {
			const geomIndex = arguments[0], posIndex = arguments[1];
			if (arguments[2] === Location.INTERIOR) this._depth[geomIndex][posIndex]++;
		}
	}
};
Depth.NULL_VALUE = -1;
// node_modules/jsts/org/locationtech/jts/util/IntArrayList.js
var IntArrayList = class IntArrayList {
	constructor() {
		IntArrayList.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._data = null;
		this._size = 0;
		if (arguments.length === 0) IntArrayList.constructor_.call(this, 10);
		else if (arguments.length === 1) {
			const initialCapacity = arguments[0];
			this._data = new Array(initialCapacity).fill(null);
		}
	}
	size() {
		return this._size;
	}
	addAll(values) {
		if (values === null) return null;
		if (values.length === 0) return null;
		this.ensureCapacity(this._size + values.length);
		System.arraycopy(values, 0, this._data, this._size, values.length);
		this._size += values.length;
	}
	ensureCapacity(capacity) {
		if (capacity <= this._data.length) return null;
		const newLength = Math.max(capacity, this._data.length * 2);
		this._data = Arrays.copyOf(this._data, newLength);
	}
	toArray() {
		const array = new Array(this._size).fill(null);
		System.arraycopy(this._data, 0, array, 0, this._size);
		return array;
	}
	add(value) {
		this.ensureCapacity(this._size + 1);
		this._data[this._size] = value;
		++this._size;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/index/MonotoneChainIndexer.js
var MonotoneChainIndexer = class MonotoneChainIndexer {
	static toIntArray(list) {
		const array = new Array(list.size()).fill(null);
		for (let i = 0; i < array.length; i++) array[i] = list.get(i).intValue();
		return array;
	}
	findChainEnd(pts, start) {
		const chainQuad = Quadrant.quadrant(pts[start], pts[start + 1]);
		let last = start + 1;
		while (last < pts.length) {
			if (Quadrant.quadrant(pts[last - 1], pts[last]) !== chainQuad) break;
			last++;
		}
		return last - 1;
	}
	OLDgetChainStartIndices(pts) {
		let start = 0;
		const startIndexList = new ArrayList();
		startIndexList.add(start);
		do {
			const last = this.findChainEnd(pts, start);
			startIndexList.add(last);
			start = last;
		} while (start < pts.length - 1);
		return MonotoneChainIndexer.toIntArray(startIndexList);
	}
	getChainStartIndices(pts) {
		let start = 0;
		const startIndexList = new IntArrayList(Math.trunc(pts.length / 2));
		startIndexList.add(start);
		do {
			const last = this.findChainEnd(pts, start);
			startIndexList.add(last);
			start = last;
		} while (start < pts.length - 1);
		return startIndexList.toArray();
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/index/MonotoneChainEdge.js
var MonotoneChainEdge = class MonotoneChainEdge {
	constructor() {
		MonotoneChainEdge.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.e = null;
		this.pts = null;
		this.startIndex = null;
		const e = arguments[0];
		this.e = e;
		this.pts = e.getCoordinates();
		const mcb = new MonotoneChainIndexer();
		this.startIndex = mcb.getChainStartIndices(this.pts);
	}
	getCoordinates() {
		return this.pts;
	}
	getMaxX(chainIndex) {
		const x1 = this.pts[this.startIndex[chainIndex]].x;
		const x2 = this.pts[this.startIndex[chainIndex + 1]].x;
		return x1 > x2 ? x1 : x2;
	}
	getMinX(chainIndex) {
		const x1 = this.pts[this.startIndex[chainIndex]].x;
		const x2 = this.pts[this.startIndex[chainIndex + 1]].x;
		return x1 < x2 ? x1 : x2;
	}
	computeIntersectsForChain() {
		if (arguments.length === 4) {
			const chainIndex0 = arguments[0], mce = arguments[1], chainIndex1 = arguments[2], si = arguments[3];
			this.computeIntersectsForChain(this.startIndex[chainIndex0], this.startIndex[chainIndex0 + 1], mce, mce.startIndex[chainIndex1], mce.startIndex[chainIndex1 + 1], si);
		} else if (arguments.length === 6) {
			const start0 = arguments[0], end0 = arguments[1], mce = arguments[2], start1 = arguments[3], end1 = arguments[4], ei = arguments[5];
			if (end0 - start0 === 1 && end1 - start1 === 1) {
				ei.addIntersections(this.e, start0, mce.e, start1);
				return null;
			}
			if (!this.overlaps(start0, end0, mce, start1, end1)) return null;
			const mid0 = Math.trunc((start0 + end0) / 2);
			const mid1 = Math.trunc((start1 + end1) / 2);
			if (start0 < mid0) {
				if (start1 < mid1) this.computeIntersectsForChain(start0, mid0, mce, start1, mid1, ei);
				if (mid1 < end1) this.computeIntersectsForChain(start0, mid0, mce, mid1, end1, ei);
			}
			if (mid0 < end0) {
				if (start1 < mid1) this.computeIntersectsForChain(mid0, end0, mce, start1, mid1, ei);
				if (mid1 < end1) this.computeIntersectsForChain(mid0, end0, mce, mid1, end1, ei);
			}
		}
	}
	overlaps(start0, end0, mce, start1, end1) {
		return Envelope.intersects(this.pts[start0], this.pts[end0], mce.pts[start1], mce.pts[end1]);
	}
	getStartIndexes() {
		return this.startIndex;
	}
	computeIntersects(mce, si) {
		for (let i = 0; i < this.startIndex.length - 1; i++) for (let j = 0; j < mce.startIndex.length - 1; j++) this.computeIntersectsForChain(i, mce, j, si);
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/Edge.js
var Edge = class Edge extends GraphComponent {
	constructor() {
		super();
		Edge.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this.pts = null;
		this._env = null;
		this.eiList = new EdgeIntersectionList(this);
		this._name = null;
		this._mce = null;
		this._isIsolated = true;
		this._depth = new Depth();
		this._depthDelta = 0;
		if (arguments.length === 1) {
			const pts = arguments[0];
			Edge.constructor_.call(this, pts, null);
		} else if (arguments.length === 2) {
			const pts = arguments[0], label = arguments[1];
			this.pts = pts;
			this._label = label;
		}
	}
	static updateIM() {
		if (arguments.length === 2 && arguments[1] instanceof IntersectionMatrix && arguments[0] instanceof Label) {
			const label = arguments[0], im = arguments[1];
			im.setAtLeastIfValid(label.getLocation(0, Position.ON), label.getLocation(1, Position.ON), 1);
			if (label.isArea()) {
				im.setAtLeastIfValid(label.getLocation(0, Position.LEFT), label.getLocation(1, Position.LEFT), 2);
				im.setAtLeastIfValid(label.getLocation(0, Position.RIGHT), label.getLocation(1, Position.RIGHT), 2);
			}
		} else return super.updateIM.apply(this, arguments);
	}
	getDepth() {
		return this._depth;
	}
	getCollapsedEdge() {
		const newPts = new Array(2).fill(null);
		newPts[0] = this.pts[0];
		newPts[1] = this.pts[1];
		return new Edge(newPts, Label.toLineLabel(this._label));
	}
	setIsolated(isIsolated) {
		this._isIsolated = isIsolated;
	}
	setName(name) {
		this._name = name;
	}
	equals(o) {
		if (!(o instanceof Edge)) return false;
		const e = o;
		if (this.pts.length !== e.pts.length) return false;
		let isEqualForward = true;
		let isEqualReverse = true;
		let iRev = this.pts.length;
		for (let i = 0; i < this.pts.length; i++) {
			if (!this.pts[i].equals2D(e.pts[i])) isEqualForward = false;
			if (!this.pts[i].equals2D(e.pts[--iRev])) isEqualReverse = false;
			if (!isEqualForward && !isEqualReverse) return false;
		}
		return true;
	}
	getCoordinate() {
		if (arguments.length === 0) {
			if (this.pts.length > 0) return this.pts[0];
			return null;
		} else if (arguments.length === 1) {
			const i = arguments[0];
			return this.pts[i];
		}
	}
	isClosed() {
		return this.pts[0].equals(this.pts[this.pts.length - 1]);
	}
	getMaximumSegmentIndex() {
		return this.pts.length - 1;
	}
	setDepthDelta(depthDelta) {
		this._depthDelta = depthDelta;
	}
	getEdgeIntersectionList() {
		return this.eiList;
	}
	addIntersections(li, segmentIndex, geomIndex) {
		for (let i = 0; i < li.getIntersectionNum(); i++) this.addIntersection(li, segmentIndex, geomIndex, i);
	}
	isIsolated() {
		return this._isIsolated;
	}
	getCoordinates() {
		return this.pts;
	}
	print(out) {
		out.print("edge " + this._name + ": ");
		out.print("LINESTRING (");
		for (let i = 0; i < this.pts.length; i++) {
			if (i > 0) out.print(",");
			out.print(this.pts[i].x + " " + this.pts[i].y);
		}
		out.print(")  " + this._label + " " + this._depthDelta);
	}
	computeIM(im) {
		Edge.updateIM(this._label, im);
	}
	isCollapsed() {
		if (!this._label.isArea()) return false;
		if (this.pts.length !== 3) return false;
		if (this.pts[0].equals(this.pts[2])) return true;
		return false;
	}
	getDepthDelta() {
		return this._depthDelta;
	}
	getNumPoints() {
		return this.pts.length;
	}
	printReverse(out) {
		out.print("edge " + this._name + ": ");
		for (let i = this.pts.length - 1; i >= 0; i--) out.print(this.pts[i] + " ");
		out.println("");
	}
	getMonotoneChainEdge() {
		if (this._mce === null) this._mce = new MonotoneChainEdge(this);
		return this._mce;
	}
	getEnvelope() {
		if (this._env === null) {
			this._env = new Envelope();
			for (let i = 0; i < this.pts.length; i++) this._env.expandToInclude(this.pts[i]);
		}
		return this._env;
	}
	addIntersection(li, segmentIndex, geomIndex, intIndex) {
		const intPt = new Coordinate(li.getIntersection(intIndex));
		let normalizedSegmentIndex = segmentIndex;
		let dist = li.getEdgeDistance(geomIndex, intIndex);
		const nextSegIndex = normalizedSegmentIndex + 1;
		if (nextSegIndex < this.pts.length) {
			const nextPt = this.pts[nextSegIndex];
			if (intPt.equals2D(nextPt)) {
				normalizedSegmentIndex = nextSegIndex;
				dist = 0;
			}
		}
		this.eiList.add(intPt, normalizedSegmentIndex, dist);
	}
	toString() {
		const builder = new StringBuilder();
		builder.append("edge " + this._name + ": ");
		builder.append("LINESTRING (");
		for (let i = 0; i < this.pts.length; i++) {
			if (i > 0) builder.append(",");
			builder.append(this.pts[i].x + " " + this.pts[i].y);
		}
		builder.append(")  " + this._label + " " + this._depthDelta);
		return builder.toString();
	}
	isPointwiseEqual(e) {
		if (this.pts.length !== e.pts.length) return false;
		for (let i = 0; i < this.pts.length; i++) if (!this.pts[i].equals2D(e.pts[i])) return false;
		return true;
	}
};
// node_modules/jsts/org/locationtech/jts/geomgraph/GeometryGraph.js
var GeometryGraph = class GeometryGraph extends PlanarGraph {
	constructor() {
		super();
		GeometryGraph.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._parentGeom = null;
		this._lineEdgeMap = new HashMap();
		this._boundaryNodeRule = null;
		this._useBoundaryDeterminationRule = true;
		this._argIndex = null;
		this._boundaryNodes = null;
		this._hasTooFewPoints = false;
		this._invalidPoint = null;
		this._areaPtLocator = null;
		this._ptLocator = new PointLocator();
		if (arguments.length === 2) {
			const argIndex = arguments[0], parentGeom = arguments[1];
			GeometryGraph.constructor_.call(this, argIndex, parentGeom, BoundaryNodeRule.OGC_SFS_BOUNDARY_RULE);
		} else if (arguments.length === 3) {
			const argIndex = arguments[0], parentGeom = arguments[1], boundaryNodeRule = arguments[2];
			this._argIndex = argIndex;
			this._parentGeom = parentGeom;
			this._boundaryNodeRule = boundaryNodeRule;
			if (parentGeom !== null) this.add(parentGeom);
		}
	}
	static determineBoundary(boundaryNodeRule, boundaryCount) {
		return boundaryNodeRule.isInBoundary(boundaryCount) ? Location.BOUNDARY : Location.INTERIOR;
	}
	insertBoundaryPoint(argIndex, coord) {
		const lbl = this._nodes.addNode(coord).getLabel();
		let boundaryCount = 1;
		let loc = Location.NONE;
		loc = lbl.getLocation(argIndex, Position.ON);
		if (loc === Location.BOUNDARY) boundaryCount++;
		const newLoc = GeometryGraph.determineBoundary(this._boundaryNodeRule, boundaryCount);
		lbl.setLocation(argIndex, newLoc);
	}
	computeSelfNodes() {
		if (arguments.length === 2) {
			const li = arguments[0], computeRingSelfNodes = arguments[1];
			return this.computeSelfNodes(li, computeRingSelfNodes, false);
		} else if (arguments.length === 3) {
			const li = arguments[0], computeRingSelfNodes = arguments[1], isDoneIfProperInt = arguments[2];
			const si = new SegmentIntersector(li, true, false);
			si.setIsDoneIfProperInt(isDoneIfProperInt);
			const esi = this.createEdgeSetIntersector();
			const isRings = this._parentGeom instanceof LinearRing || this._parentGeom instanceof Polygon || this._parentGeom instanceof MultiPolygon;
			const computeAllSegments = computeRingSelfNodes || !isRings;
			esi.computeIntersections(this._edges, si, computeAllSegments);
			this.addSelfIntersectionNodes(this._argIndex);
			return si;
		}
	}
	addPolygon(p) {
		this.addPolygonRing(p.getExteriorRing(), Location.EXTERIOR, Location.INTERIOR);
		for (let i = 0; i < p.getNumInteriorRing(); i++) {
			const hole = p.getInteriorRingN(i);
			this.addPolygonRing(hole, Location.INTERIOR, Location.EXTERIOR);
		}
	}
	addEdge(e) {
		this.insertEdge(e);
		const coord = e.getCoordinates();
		this.insertPoint(this._argIndex, coord[0], Location.BOUNDARY);
		this.insertPoint(this._argIndex, coord[coord.length - 1], Location.BOUNDARY);
	}
	addLineString(line) {
		const coord = CoordinateArrays.removeRepeatedPoints(line.getCoordinates());
		if (coord.length < 2) {
			this._hasTooFewPoints = true;
			this._invalidPoint = coord[0];
			return null;
		}
		const e = new Edge(coord, new Label(this._argIndex, Location.INTERIOR));
		this._lineEdgeMap.put(line, e);
		this.insertEdge(e);
		Assert.isTrue(coord.length >= 2, "found LineString with single point");
		this.insertBoundaryPoint(this._argIndex, coord[0]);
		this.insertBoundaryPoint(this._argIndex, coord[coord.length - 1]);
	}
	getInvalidPoint() {
		return this._invalidPoint;
	}
	getBoundaryPoints() {
		const coll = this.getBoundaryNodes();
		const pts = new Array(coll.size()).fill(null);
		let i = 0;
		for (let it = coll.iterator(); it.hasNext();) {
			const node = it.next();
			pts[i++] = node.getCoordinate().copy();
		}
		return pts;
	}
	addSelfIntersectionNodes(argIndex) {
		for (let i = this._edges.iterator(); i.hasNext();) {
			const e = i.next();
			const eLoc = e.getLabel().getLocation(argIndex);
			for (let eiIt = e.eiList.iterator(); eiIt.hasNext();) {
				const ei = eiIt.next();
				this.addSelfIntersectionNode(argIndex, ei.coord, eLoc);
			}
		}
	}
	add() {
		if (arguments.length === 1 && arguments[0] instanceof Geometry) {
			const g = arguments[0];
			if (g.isEmpty()) return null;
			if (g instanceof MultiPolygon) this._useBoundaryDeterminationRule = false;
			if (g instanceof Polygon) this.addPolygon(g);
			else if (g instanceof LineString) this.addLineString(g);
			else if (g instanceof Point) this.addPoint(g);
			else if (g instanceof MultiPoint) this.addCollection(g);
			else if (g instanceof MultiLineString) this.addCollection(g);
			else if (g instanceof MultiPolygon) this.addCollection(g);
			else if (g instanceof GeometryCollection) this.addCollection(g);
			else throw new UnsupportedOperationException(g.getGeometryType());
		} else return super.add.apply(this, arguments);
	}
	addCollection(gc) {
		for (let i = 0; i < gc.getNumGeometries(); i++) {
			const g = gc.getGeometryN(i);
			this.add(g);
		}
	}
	locate(pt) {
		if (hasInterface_default(this._parentGeom, Polygonal) && this._parentGeom.getNumGeometries() > 50) {
			if (this._areaPtLocator === null) this._areaPtLocator = new IndexedPointInAreaLocator(this._parentGeom);
			return this._areaPtLocator.locate(pt);
		}
		return this._ptLocator.locate(pt, this._parentGeom);
	}
	findEdge() {
		if (arguments.length === 1 && arguments[0] instanceof LineString) {
			const line = arguments[0];
			return this._lineEdgeMap.get(line);
		} else return super.findEdge.apply(this, arguments);
	}
	computeSplitEdges(edgelist) {
		for (let i = this._edges.iterator(); i.hasNext();) i.next().eiList.addSplitEdges(edgelist);
	}
	computeEdgeIntersections(g, li, includeProper) {
		const si = new SegmentIntersector(li, includeProper, true);
		si.setBoundaryNodes(this.getBoundaryNodes(), g.getBoundaryNodes());
		this.createEdgeSetIntersector().computeIntersections(this._edges, g._edges, si);
		return si;
	}
	getGeometry() {
		return this._parentGeom;
	}
	getBoundaryNodeRule() {
		return this._boundaryNodeRule;
	}
	hasTooFewPoints() {
		return this._hasTooFewPoints;
	}
	addPoint() {
		if (arguments[0] instanceof Point) {
			const coord = arguments[0].getCoordinate();
			this.insertPoint(this._argIndex, coord, Location.INTERIOR);
		} else if (arguments[0] instanceof Coordinate) {
			const pt = arguments[0];
			this.insertPoint(this._argIndex, pt, Location.INTERIOR);
		}
	}
	getBoundaryNodes() {
		if (this._boundaryNodes === null) this._boundaryNodes = this._nodes.getBoundaryNodes(this._argIndex);
		return this._boundaryNodes;
	}
	addSelfIntersectionNode(argIndex, coord, loc) {
		if (this.isBoundaryNode(argIndex, coord)) return null;
		if (loc === Location.BOUNDARY && this._useBoundaryDeterminationRule) this.insertBoundaryPoint(argIndex, coord);
		else this.insertPoint(argIndex, coord, loc);
	}
	addPolygonRing(lr, cwLeft, cwRight) {
		if (lr.isEmpty()) return null;
		const coord = CoordinateArrays.removeRepeatedPoints(lr.getCoordinates());
		if (coord.length < 4) {
			this._hasTooFewPoints = true;
			this._invalidPoint = coord[0];
			return null;
		}
		let left = cwLeft;
		let right = cwRight;
		if (Orientation.isCCW(coord)) {
			left = cwRight;
			right = cwLeft;
		}
		const e = new Edge(coord, new Label(this._argIndex, Location.BOUNDARY, left, right));
		this._lineEdgeMap.put(lr, e);
		this.insertEdge(e);
		this.insertPoint(this._argIndex, coord[0], Location.BOUNDARY);
	}
	insertPoint(argIndex, coord, onLocation) {
		const n = this._nodes.addNode(coord);
		const lbl = n.getLabel();
		if (lbl === null) n._label = new Label(argIndex, onLocation);
		else lbl.setLocation(argIndex, onLocation);
	}
	createEdgeSetIntersector() {
		return new SimpleMCSweepLineIntersector();
	}
};
// node_modules/jsts/org/locationtech/jts/operation/relate/EdgeEndBundle.js
var EdgeEndBundle = class EdgeEndBundle extends EdgeEnd {
	constructor() {
		super();
		EdgeEndBundle.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._edgeEnds = new ArrayList();
		if (arguments.length === 1) {
			const e = arguments[0];
			EdgeEndBundle.constructor_.call(this, null, e);
		} else if (arguments.length === 2) {
			arguments[0];
			const e = arguments[1];
			EdgeEnd.constructor_.call(this, e.getEdge(), e.getCoordinate(), e.getDirectedCoordinate(), new Label(e.getLabel()));
			this.insert(e);
		}
	}
	insert(e) {
		this._edgeEnds.add(e);
	}
	print(out) {
		out.println("EdgeEndBundle--> Label: " + this._label);
		for (let it = this.iterator(); it.hasNext();) {
			it.next().print(out);
			out.println();
		}
	}
	iterator() {
		return this._edgeEnds.iterator();
	}
	getEdgeEnds() {
		return this._edgeEnds;
	}
	computeLabelOn(geomIndex, boundaryNodeRule) {
		let boundaryCount = 0;
		let foundInterior = false;
		for (let it = this.iterator(); it.hasNext();) {
			const loc = it.next().getLabel().getLocation(geomIndex);
			if (loc === Location.BOUNDARY) boundaryCount++;
			if (loc === Location.INTERIOR) foundInterior = true;
		}
		let loc = Location.NONE;
		if (foundInterior) loc = Location.INTERIOR;
		if (boundaryCount > 0) loc = GeometryGraph.determineBoundary(boundaryNodeRule, boundaryCount);
		this._label.setLocation(geomIndex, loc);
	}
	computeLabelSide(geomIndex, side) {
		for (let it = this.iterator(); it.hasNext();) {
			const e = it.next();
			if (e.getLabel().isArea()) {
				const loc = e.getLabel().getLocation(geomIndex, side);
				if (loc === Location.INTERIOR) {
					this._label.setLocation(geomIndex, side, Location.INTERIOR);
					return null;
				} else if (loc === Location.EXTERIOR) this._label.setLocation(geomIndex, side, Location.EXTERIOR);
			}
		}
	}
	getLabel() {
		return this._label;
	}
	computeLabelSides(geomIndex) {
		this.computeLabelSide(geomIndex, Position.LEFT);
		this.computeLabelSide(geomIndex, Position.RIGHT);
	}
	updateIM(im) {
		Edge.updateIM(this._label, im);
	}
	computeLabel(boundaryNodeRule) {
		let isArea = false;
		for (let it = this.iterator(); it.hasNext();) if (it.next().getLabel().isArea()) isArea = true;
		if (isArea) this._label = new Label(Location.NONE, Location.NONE, Location.NONE);
		else this._label = new Label(Location.NONE);
		for (let i = 0; i < 2; i++) {
			this.computeLabelOn(i, boundaryNodeRule);
			if (isArea) this.computeLabelSides(i);
		}
	}
};
// node_modules/jsts/org/locationtech/jts/operation/relate/EdgeEndBundleStar.js
var EdgeEndBundleStar = class extends EdgeEndStar {
	constructor() {
		super();
	}
	updateIM(im) {
		for (let it = this.iterator(); it.hasNext();) it.next().updateIM(im);
	}
	insert(e) {
		let eb = this._edgeMap.get(e);
		if (eb === null) {
			eb = new EdgeEndBundle(e);
			this.insertEdgeEnd(e, eb);
		} else eb.insert(e);
	}
};
// node_modules/jsts/org/locationtech/jts/operation/relate/RelateNode.js
var RelateNode = class RelateNode extends Node {
	constructor() {
		super();
		RelateNode.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const coord = arguments[0], edges = arguments[1];
		Node.constructor_.call(this, coord, edges);
	}
	computeIM(im) {
		im.setAtLeastIfValid(this._label.getLocation(0), this._label.getLocation(1), 0);
	}
	updateIMFromEdges(im) {
		this._edges.updateIM(im);
	}
};
// node_modules/jsts/org/locationtech/jts/operation/relate/RelateNodeFactory.js
var RelateNodeFactory = class extends NodeFactory {
	constructor() {
		super();
	}
	createNode(coord) {
		return new RelateNode(coord, new EdgeEndBundleStar());
	}
};
// node_modules/jsts/org/locationtech/jts/operation/relate/RelateNodeGraph.js
var RelateNodeGraph = class RelateNodeGraph {
	constructor() {
		RelateNodeGraph.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._nodes = new NodeMap(new RelateNodeFactory());
	}
	insertEdgeEnds(ee) {
		for (let i = ee.iterator(); i.hasNext();) {
			const e = i.next();
			this._nodes.add(e);
		}
	}
	getNodeIterator() {
		return this._nodes.iterator();
	}
	copyNodesAndLabels(geomGraph, argIndex) {
		for (let nodeIt = geomGraph.getNodeIterator(); nodeIt.hasNext();) {
			const graphNode = nodeIt.next();
			this._nodes.addNode(graphNode.getCoordinate()).setLabel(argIndex, graphNode.getLabel().getLocation(argIndex));
		}
	}
	build(geomGraph) {
		this.computeIntersectionNodes(geomGraph, 0);
		this.copyNodesAndLabels(geomGraph, 0);
		const eeList = new EdgeEndBuilder().computeEdgeEnds(geomGraph.getEdgeIterator());
		this.insertEdgeEnds(eeList);
	}
	computeIntersectionNodes(geomGraph, argIndex) {
		for (let edgeIt = geomGraph.getEdgeIterator(); edgeIt.hasNext();) {
			const e = edgeIt.next();
			const eLoc = e.getLabel().getLocation(argIndex);
			for (let eiIt = e.getEdgeIntersectionList().iterator(); eiIt.hasNext();) {
				const ei = eiIt.next();
				const n = this._nodes.addNode(ei.coord);
				if (eLoc === Location.BOUNDARY) n.setLabelBoundary(argIndex);
				else if (n.getLabel().isNull(argIndex)) n.setLabel(argIndex, Location.INTERIOR);
			}
		}
	}
};
// node_modules/jsts/org/locationtech/jts/operation/valid/ConsistentAreaTester.js
var ConsistentAreaTester = class ConsistentAreaTester {
	constructor() {
		ConsistentAreaTester.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._li = new RobustLineIntersector();
		this._geomGraph = null;
		this._nodeGraph = new RelateNodeGraph();
		this._invalidPoint = null;
		const geomGraph = arguments[0];
		this._geomGraph = geomGraph;
	}
	isNodeEdgeAreaLabelsConsistent() {
		for (let nodeIt = this._nodeGraph.getNodeIterator(); nodeIt.hasNext();) {
			const node = nodeIt.next();
			if (!node.getEdges().isAreaLabelsConsistent(this._geomGraph)) {
				this._invalidPoint = node.getCoordinate().copy();
				return false;
			}
		}
		return true;
	}
	hasDuplicateRings() {
		for (let nodeIt = this._nodeGraph.getNodeIterator(); nodeIt.hasNext();) {
			const node = nodeIt.next();
			for (let i = node.getEdges().iterator(); i.hasNext();) {
				const eeb = i.next();
				if (eeb.getEdgeEnds().size() > 1) {
					this._invalidPoint = eeb.getEdge().getCoordinate(0);
					return true;
				}
			}
		}
		return false;
	}
	isNodeConsistentArea() {
		const intersector = this._geomGraph.computeSelfNodes(this._li, true, true);
		if (intersector.hasProperIntersection()) {
			this._invalidPoint = intersector.getProperIntersectionPoint();
			return false;
		}
		this._nodeGraph.build(this._geomGraph);
		return this.isNodeEdgeAreaLabelsConsistent();
	}
	getInvalidPoint() {
		return this._invalidPoint;
	}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/Boundable.js
var Boundable = class {
	getBounds() {}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/ItemBoundable.js
var ItemBoundable = class ItemBoundable {
	constructor() {
		ItemBoundable.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._bounds = null;
		this._item = null;
		const bounds = arguments[0], item = arguments[1];
		this._bounds = bounds;
		this._item = item;
	}
	getItem() {
		return this._item;
	}
	getBounds() {
		return this._bounds;
	}
	get interfaces_() {
		return [Boundable, Serializable];
	}
};
// node_modules/jsts/java/util/PriorityQueue.js
var import_FastPriorityQueue = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var defaultcomparator = function(a, b) {
		return a < b;
	};
	function FastPriorityQueue(comparator) {
		if (!(this instanceof FastPriorityQueue)) return new FastPriorityQueue(comparator);
		this.array = [];
		this.size = 0;
		this.compare = comparator || defaultcomparator;
	}
	FastPriorityQueue.prototype.clone = function() {
		var fpq = new FastPriorityQueue(this.compare);
		fpq.size = this.size;
		fpq.array = this.array.slice(0, this.size);
		return fpq;
	};
	FastPriorityQueue.prototype.add = function(myval) {
		var i = this.size;
		this.array[this.size] = myval;
		this.size += 1;
		var p;
		var ap;
		while (i > 0) {
			p = i - 1 >> 1;
			ap = this.array[p];
			if (!this.compare(myval, ap)) break;
			this.array[i] = ap;
			i = p;
		}
		this.array[i] = myval;
	};
	FastPriorityQueue.prototype.heapify = function(arr) {
		this.array = arr;
		this.size = arr.length;
		var i = this.size >> 1;
		for (; i >= 0; i--) this._percolateDown(i);
	};
	FastPriorityQueue.prototype._percolateUp = function(i, force) {
		var myval = this.array[i];
		var p;
		var ap;
		while (i > 0) {
			p = i - 1 >> 1;
			ap = this.array[p];
			if (!force && !this.compare(myval, ap)) break;
			this.array[i] = ap;
			i = p;
		}
		this.array[i] = myval;
	};
	FastPriorityQueue.prototype._percolateDown = function(i) {
		var size = this.size;
		var hsize = this.size >>> 1;
		var ai = this.array[i];
		var l;
		var r;
		var bestc;
		while (i < hsize) {
			l = (i << 1) + 1;
			r = l + 1;
			bestc = this.array[l];
			if (r < size) {
				if (this.compare(this.array[r], bestc)) {
					l = r;
					bestc = this.array[r];
				}
			}
			if (!this.compare(bestc, ai)) break;
			this.array[i] = bestc;
			i = l;
		}
		this.array[i] = ai;
	};
	FastPriorityQueue.prototype._removeAt = function(index) {
		if (index > this.size - 1 || index < 0) return void 0;
		this._percolateUp(index, true);
		return this.poll();
	};
	FastPriorityQueue.prototype.remove = function(myval) {
		for (var i = 0; i < this.size; i++) if (!this.compare(this.array[i], myval) && !this.compare(myval, this.array[i])) {
			this._removeAt(i);
			return true;
		}
		return false;
	};
	FastPriorityQueue.prototype.removeOne = function(callback) {
		if (typeof callback !== "function") return;
		for (var i = 0; i < this.size; i++) if (callback(this.array[i])) return this._removeAt(i);
	};
	FastPriorityQueue.prototype.removeMany = function(callback, limit) {
		if (typeof callback !== "function" || this.size < 1) return [];
		limit = limit ? Math.min(limit, this.size) : this.size;
		var resultSize = 0;
		var result = new Array(limit);
		var tmpSize = 0;
		var tmp = new Array(this.size);
		while (resultSize < limit && !this.isEmpty()) {
			var item = this.poll();
			if (callback(item)) result[resultSize++] = item;
			else tmp[tmpSize++] = item;
		}
		result.length = resultSize;
		var i = 0;
		while (i < tmpSize) this.add(tmp[i++]);
		return result;
	};
	FastPriorityQueue.prototype.peek = function() {
		if (this.size == 0) return void 0;
		return this.array[0];
	};
	FastPriorityQueue.prototype.poll = function() {
		if (this.size == 0) return void 0;
		var ans = this.array[0];
		if (this.size > 1) {
			this.array[0] = this.array[--this.size];
			this._percolateDown(0);
		} else this.size -= 1;
		return ans;
	};
	FastPriorityQueue.prototype.replaceTop = function(myval) {
		if (this.size == 0) return void 0;
		var ans = this.array[0];
		this.array[0] = myval;
		this._percolateDown(0);
		return ans;
	};
	FastPriorityQueue.prototype.trim = function() {
		this.array = this.array.slice(0, this.size);
	};
	FastPriorityQueue.prototype.isEmpty = function() {
		return this.size === 0;
	};
	FastPriorityQueue.prototype.forEach = function(callback) {
		if (this.isEmpty() || typeof callback != "function") return;
		var i = 0;
		var fpq = this.clone();
		while (!fpq.isEmpty()) callback(fpq.poll(), i++);
	};
	FastPriorityQueue.prototype.kSmallest = function(k) {
		if (this.size == 0 || k <= 0) return [];
		k = Math.min(this.size, k);
		const newSize = Math.min(this.size, 2 ** (k - 1) + 1);
		if (newSize < 2) return [this.peek()];
		const fpq = new FastPriorityQueue(this.compare);
		fpq.size = newSize;
		fpq.array = this.array.slice(0, newSize);
		const smallest = new Array(k);
		for (let i = 0; i < k; i++) smallest[i] = fpq.poll();
		return smallest;
	};
	module.exports = FastPriorityQueue;
})))(), 1);
var PriorityQueue = class {
	constructor() {
		this._fpQueue = new import_FastPriorityQueue.default((a, b) => a.compareTo(b) < 0);
	}
	poll() {
		return this._fpQueue.poll();
	}
	size() {
		return this._fpQueue.size;
	}
	clear() {
		this._fpQueue = new import_FastPriorityQueue.default();
	}
	peek() {
		return this._fpQueue.peek();
	}
	remove() {
		return this._fpQueue.poll();
	}
	isEmpty() {
		return this._fpQueue.isEmpty();
	}
	add(x) {
		this._fpQueue.add(x);
	}
};
// node_modules/jsts/org/locationtech/jts/index/SpatialIndex.js
var SpatialIndex = class {
	query() {
		if (arguments.length === 1) arguments[0];
		else if (arguments.length === 2) {
			arguments[0];
			arguments[1];
		}
	}
	insert(itemEnv, item) {}
	remove(itemEnv, item) {}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/AbstractNode.js
var AbstractNode = class AbstractNode {
	constructor() {
		AbstractNode.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._childBoundables = new ArrayList();
		this._bounds = null;
		this._level = null;
		if (arguments.length === 0) {} else if (arguments.length === 1) {
			const level = arguments[0];
			this._level = level;
		}
	}
	getLevel() {
		return this._level;
	}
	addChildBoundable(childBoundable) {
		Assert.isTrue(this._bounds === null);
		this._childBoundables.add(childBoundable);
	}
	isEmpty() {
		return this._childBoundables.isEmpty();
	}
	getBounds() {
		if (this._bounds === null) this._bounds = this.computeBounds();
		return this._bounds;
	}
	size() {
		return this._childBoundables.size();
	}
	getChildBoundables() {
		return this._childBoundables;
	}
	get interfaces_() {
		return [Boundable, Serializable];
	}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/EnvelopeDistance.js
var EnvelopeDistance = class EnvelopeDistance {
	static distance(x1, y1, x2, y2) {
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}
	static maximumDistance(env1, env2) {
		const minx = Math.min(env1.getMinX(), env2.getMinX());
		const miny = Math.min(env1.getMinY(), env2.getMinY());
		const maxx = Math.max(env1.getMaxX(), env2.getMaxX());
		const maxy = Math.max(env1.getMaxY(), env2.getMaxY());
		return EnvelopeDistance.distance(minx, miny, maxx, maxy);
	}
	static minMaxDistance(a, b) {
		const aminx = a.getMinX();
		const aminy = a.getMinY();
		const amaxx = a.getMaxX();
		const amaxy = a.getMaxY();
		const bminx = b.getMinX();
		const bminy = b.getMinY();
		const bmaxx = b.getMaxX();
		const bmaxy = b.getMaxY();
		let dist = EnvelopeDistance.maxDistance(aminx, aminy, aminx, amaxy, bminx, bminy, bminx, bmaxy);
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, aminx, amaxy, bminx, bminy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, aminx, amaxy, bmaxx, bmaxy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, aminx, amaxy, bmaxx, bmaxy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, amaxx, aminy, bminx, bminy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, amaxx, aminy, bminx, bminy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, amaxx, aminy, bmaxx, bmaxy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(aminx, aminy, amaxx, aminy, bmaxx, bmaxy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, aminx, amaxy, bminx, bminy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, aminx, amaxy, bminx, bminy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, aminx, amaxy, bmaxx, bmaxy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, aminx, amaxy, bmaxx, bmaxy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, amaxx, aminy, bminx, bminy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, amaxx, aminy, bminx, bminy, bmaxx, bminy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, amaxx, aminy, bmaxx, bmaxy, bminx, bmaxy));
		dist = Math.min(dist, EnvelopeDistance.maxDistance(amaxx, amaxy, amaxx, aminy, bmaxx, bmaxy, bmaxx, bminy));
		return dist;
	}
	static maxDistance(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
		let dist = EnvelopeDistance.distance(ax1, ay1, bx1, by1);
		dist = Math.max(dist, EnvelopeDistance.distance(ax1, ay1, bx2, by2));
		dist = Math.max(dist, EnvelopeDistance.distance(ax2, ay2, bx1, by1));
		dist = Math.max(dist, EnvelopeDistance.distance(ax2, ay2, bx2, by2));
		return dist;
	}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/BoundablePair.js
var BoundablePair = class BoundablePair {
	constructor() {
		BoundablePair.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._boundable1 = null;
		this._boundable2 = null;
		this._distance = null;
		this._itemDistance = null;
		const boundable1 = arguments[0], boundable2 = arguments[1], itemDistance = arguments[2];
		this._boundable1 = boundable1;
		this._boundable2 = boundable2;
		this._itemDistance = itemDistance;
		this._distance = this.distance();
	}
	static area(b) {
		return b.getBounds().getArea();
	}
	static isComposite(item) {
		return item instanceof AbstractNode;
	}
	maximumDistance() {
		return EnvelopeDistance.maximumDistance(this._boundable1.getBounds(), this._boundable2.getBounds());
	}
	expandToQueue(priQ, minDistance) {
		const isComp1 = BoundablePair.isComposite(this._boundable1);
		const isComp2 = BoundablePair.isComposite(this._boundable2);
		if (isComp1 && isComp2) {
			if (BoundablePair.area(this._boundable1) > BoundablePair.area(this._boundable2)) {
				this.expand(this._boundable1, this._boundable2, false, priQ, minDistance);
				return null;
			} else {
				this.expand(this._boundable2, this._boundable1, true, priQ, minDistance);
				return null;
			}
		} else if (isComp1) {
			this.expand(this._boundable1, this._boundable2, false, priQ, minDistance);
			return null;
		} else if (isComp2) {
			this.expand(this._boundable2, this._boundable1, true, priQ, minDistance);
			return null;
		}
		throw new IllegalArgumentException("neither boundable is composite");
	}
	isLeaves() {
		return !(BoundablePair.isComposite(this._boundable1) || BoundablePair.isComposite(this._boundable2));
	}
	getBoundable(i) {
		if (i === 0) return this._boundable1;
		return this._boundable2;
	}
	getDistance() {
		return this._distance;
	}
	distance() {
		if (this.isLeaves()) return this._itemDistance.distance(this._boundable1, this._boundable2);
		return this._boundable1.getBounds().distance(this._boundable2.getBounds());
	}
	compareTo(o) {
		const nd = o;
		if (this._distance < nd._distance) return -1;
		if (this._distance > nd._distance) return 1;
		return 0;
	}
	expand(bndComposite, bndOther, isFlipped, priQ, minDistance) {
		const children = bndComposite.getChildBoundables();
		for (let i = children.iterator(); i.hasNext();) {
			const child = i.next();
			let bp = null;
			if (isFlipped) bp = new BoundablePair(bndOther, child, this._itemDistance);
			else bp = new BoundablePair(child, bndOther, this._itemDistance);
			if (bp.getDistance() < minDistance) priQ.add(bp);
		}
	}
	get interfaces_() {
		return [Comparable];
	}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/AbstractSTRtree.js
var AbstractSTRtree = class AbstractSTRtree {
	constructor() {
		AbstractSTRtree.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._root = null;
		this._built = false;
		this._itemBoundables = new ArrayList();
		this._nodeCapacity = null;
		if (arguments.length === 0) AbstractSTRtree.constructor_.call(this, AbstractSTRtree.DEFAULT_NODE_CAPACITY);
		else if (arguments.length === 1) {
			const nodeCapacity = arguments[0];
			Assert.isTrue(nodeCapacity > 1, "Node capacity must be greater than 1");
			this._nodeCapacity = nodeCapacity;
		}
	}
	static compareDoubles(a, b) {
		return a > b ? 1 : a < b ? -1 : 0;
	}
	queryInternal() {
		if (hasInterface_default(arguments[2], ItemVisitor) && arguments[0] instanceof Object && arguments[1] instanceof AbstractNode) {
			const searchBounds = arguments[0], node = arguments[1], visitor = arguments[2];
			const childBoundables = node.getChildBoundables();
			for (let i = 0; i < childBoundables.size(); i++) {
				const childBoundable = childBoundables.get(i);
				if (!this.getIntersectsOp().intersects(childBoundable.getBounds(), searchBounds)) continue;
				if (childBoundable instanceof AbstractNode) this.queryInternal(searchBounds, childBoundable, visitor);
				else if (childBoundable instanceof ItemBoundable) visitor.visitItem(childBoundable.getItem());
				else Assert.shouldNeverReachHere();
			}
		} else if (hasInterface_default(arguments[2], List) && arguments[0] instanceof Object && arguments[1] instanceof AbstractNode) {
			const searchBounds = arguments[0], node = arguments[1], matches = arguments[2];
			const childBoundables = node.getChildBoundables();
			for (let i = 0; i < childBoundables.size(); i++) {
				const childBoundable = childBoundables.get(i);
				if (!this.getIntersectsOp().intersects(childBoundable.getBounds(), searchBounds)) continue;
				if (childBoundable instanceof AbstractNode) this.queryInternal(searchBounds, childBoundable, matches);
				else if (childBoundable instanceof ItemBoundable) matches.add(childBoundable.getItem());
				else Assert.shouldNeverReachHere();
			}
		}
	}
	insert(bounds, item) {
		Assert.isTrue(!this._built, "Cannot insert items into an STR packed R-tree after it has been built.");
		this._itemBoundables.add(new ItemBoundable(bounds, item));
	}
	boundablesAtLevel() {
		if (arguments.length === 1) {
			const level = arguments[0];
			const boundables = new ArrayList();
			this.boundablesAtLevel(level, this._root, boundables);
			return boundables;
		} else if (arguments.length === 3) {
			const level = arguments[0], top = arguments[1], boundables = arguments[2];
			Assert.isTrue(level > -2);
			if (top.getLevel() === level) {
				boundables.add(top);
				return null;
			}
			for (let i = top.getChildBoundables().iterator(); i.hasNext();) {
				const boundable = i.next();
				if (boundable instanceof AbstractNode) this.boundablesAtLevel(level, boundable, boundables);
				else {
					Assert.isTrue(boundable instanceof ItemBoundable);
					if (level === -1) boundables.add(boundable);
				}
			}
			return null;
		}
	}
	getRoot() {
		this.build();
		return this._root;
	}
	remove() {
		if (arguments.length === 2) {
			const searchBounds = arguments[0], item = arguments[1];
			this.build();
			if (this.getIntersectsOp().intersects(this._root.getBounds(), searchBounds)) return this.remove(searchBounds, this._root, item);
			return false;
		} else if (arguments.length === 3) {
			const searchBounds = arguments[0], node = arguments[1], item = arguments[2];
			let found = this.removeItem(node, item);
			if (found) return true;
			let childToPrune = null;
			for (let i = node.getChildBoundables().iterator(); i.hasNext();) {
				const childBoundable = i.next();
				if (!this.getIntersectsOp().intersects(childBoundable.getBounds(), searchBounds)) continue;
				if (childBoundable instanceof AbstractNode) {
					found = this.remove(searchBounds, childBoundable, item);
					if (found) {
						childToPrune = childBoundable;
						break;
					}
				}
			}
			if (childToPrune !== null) {
				if (childToPrune.getChildBoundables().isEmpty()) node.getChildBoundables().remove(childToPrune);
			}
			return found;
		}
	}
	createHigherLevels(boundablesOfALevel, level) {
		Assert.isTrue(!boundablesOfALevel.isEmpty());
		const parentBoundables = this.createParentBoundables(boundablesOfALevel, level + 1);
		if (parentBoundables.size() === 1) return parentBoundables.get(0);
		return this.createHigherLevels(parentBoundables, level + 1);
	}
	depth() {
		if (arguments.length === 0) {
			if (this.isEmpty()) return 0;
			this.build();
			return this.depth(this._root);
		} else if (arguments.length === 1) {
			const node = arguments[0];
			let maxChildDepth = 0;
			for (let i = node.getChildBoundables().iterator(); i.hasNext();) {
				const childBoundable = i.next();
				if (childBoundable instanceof AbstractNode) {
					const childDepth = this.depth(childBoundable);
					if (childDepth > maxChildDepth) maxChildDepth = childDepth;
				}
			}
			return maxChildDepth + 1;
		}
	}
	createParentBoundables(childBoundables, newLevel) {
		Assert.isTrue(!childBoundables.isEmpty());
		const parentBoundables = new ArrayList();
		parentBoundables.add(this.createNode(newLevel));
		const sortedChildBoundables = new ArrayList(childBoundables);
		Collections.sort(sortedChildBoundables, this.getComparator());
		for (let i = sortedChildBoundables.iterator(); i.hasNext();) {
			const childBoundable = i.next();
			if (this.lastNode(parentBoundables).getChildBoundables().size() === this.getNodeCapacity()) parentBoundables.add(this.createNode(newLevel));
			this.lastNode(parentBoundables).addChildBoundable(childBoundable);
		}
		return parentBoundables;
	}
	isEmpty() {
		if (!this._built) return this._itemBoundables.isEmpty();
		return this._root.isEmpty();
	}
	getNodeCapacity() {
		return this._nodeCapacity;
	}
	lastNode(nodes) {
		return nodes.get(nodes.size() - 1);
	}
	size() {
		if (arguments.length === 0) {
			if (this.isEmpty()) return 0;
			this.build();
			return this.size(this._root);
		} else if (arguments.length === 1) {
			const node = arguments[0];
			let size = 0;
			for (let i = node.getChildBoundables().iterator(); i.hasNext();) {
				const childBoundable = i.next();
				if (childBoundable instanceof AbstractNode) size += this.size(childBoundable);
				else if (childBoundable instanceof ItemBoundable) size += 1;
			}
			return size;
		}
	}
	removeItem(node, item) {
		let childToRemove = null;
		for (let i = node.getChildBoundables().iterator(); i.hasNext();) {
			const childBoundable = i.next();
			if (childBoundable instanceof ItemBoundable) {
				if (childBoundable.getItem() === item) childToRemove = childBoundable;
			}
		}
		if (childToRemove !== null) {
			node.getChildBoundables().remove(childToRemove);
			return true;
		}
		return false;
	}
	itemsTree() {
		if (arguments.length === 0) {
			this.build();
			const valuesTree = this.itemsTree(this._root);
			if (valuesTree === null) return new ArrayList();
			return valuesTree;
		} else if (arguments.length === 1) {
			const node = arguments[0];
			const valuesTreeForNode = new ArrayList();
			for (let i = node.getChildBoundables().iterator(); i.hasNext();) {
				const childBoundable = i.next();
				if (childBoundable instanceof AbstractNode) {
					const valuesTreeForChild = this.itemsTree(childBoundable);
					if (valuesTreeForChild !== null) valuesTreeForNode.add(valuesTreeForChild);
				} else if (childBoundable instanceof ItemBoundable) valuesTreeForNode.add(childBoundable.getItem());
				else Assert.shouldNeverReachHere();
			}
			if (valuesTreeForNode.size() <= 0) return null;
			return valuesTreeForNode;
		}
	}
	query() {
		if (arguments.length === 1) {
			const searchBounds = arguments[0];
			this.build();
			const matches = new ArrayList();
			if (this.isEmpty()) return matches;
			if (this.getIntersectsOp().intersects(this._root.getBounds(), searchBounds)) this.queryInternal(searchBounds, this._root, matches);
			return matches;
		} else if (arguments.length === 2) {
			const searchBounds = arguments[0], visitor = arguments[1];
			this.build();
			if (this.isEmpty()) return null;
			if (this.getIntersectsOp().intersects(this._root.getBounds(), searchBounds)) this.queryInternal(searchBounds, this._root, visitor);
		}
	}
	build() {
		if (this._built) return null;
		this._root = this._itemBoundables.isEmpty() ? this.createNode(0) : this.createHigherLevels(this._itemBoundables, -1);
		this._itemBoundables = null;
		this._built = true;
	}
	get interfaces_() {
		return [Serializable];
	}
};
function IntersectsOp$1() {}
AbstractSTRtree.IntersectsOp = IntersectsOp$1;
AbstractSTRtree.DEFAULT_NODE_CAPACITY = 10;
// node_modules/jsts/org/locationtech/jts/index/strtree/ItemDistance.js
var ItemDistance = class {
	distance(item1, item2) {}
};
// node_modules/jsts/org/locationtech/jts/index/strtree/STRtree.js
var STRtree = class STRtree extends AbstractSTRtree {
	constructor() {
		super();
		STRtree.constructor_.apply(this, arguments);
	}
	static constructor_() {
		if (arguments.length === 0) STRtree.constructor_.call(this, STRtree.DEFAULT_NODE_CAPACITY);
		else if (arguments.length === 1) {
			const nodeCapacity = arguments[0];
			AbstractSTRtree.constructor_.call(this, nodeCapacity);
		}
	}
	static getItems(kNearestNeighbors) {
		const items = new Array(kNearestNeighbors.size()).fill(null);
		let count = 0;
		while (!kNearestNeighbors.isEmpty()) {
			const bp = kNearestNeighbors.poll();
			items[count] = bp.getBoundable(0).getItem();
			count++;
		}
		return items;
	}
	static avg(a, b) {
		return (a + b) / 2;
	}
	static centreY(e) {
		return STRtree.avg(e.getMinY(), e.getMaxY());
	}
	static centreX(e) {
		return STRtree.avg(e.getMinX(), e.getMaxX());
	}
	size() {
		if (arguments.length === 0) return super.size.call(this);
		else return super.size.apply(this, arguments);
	}
	insert() {
		if (arguments.length === 2 && arguments[1] instanceof Object && arguments[0] instanceof Envelope) {
			const itemEnv = arguments[0], item = arguments[1];
			if (itemEnv.isNull()) return null;
			super.insert.call(this, itemEnv, item);
		} else return super.insert.apply(this, arguments);
	}
	getIntersectsOp() {
		return STRtree.intersectsOp;
	}
	verticalSlices(childBoundables, sliceCount) {
		const sliceCapacity = Math.trunc(Math.ceil(childBoundables.size() / sliceCount));
		const slices = new Array(sliceCount).fill(null);
		const i = childBoundables.iterator();
		for (let j = 0; j < sliceCount; j++) {
			slices[j] = new ArrayList();
			let boundablesAddedToSlice = 0;
			while (i.hasNext() && boundablesAddedToSlice < sliceCapacity) {
				const childBoundable = i.next();
				slices[j].add(childBoundable);
				boundablesAddedToSlice++;
			}
		}
		return slices;
	}
	query() {
		if (arguments.length === 1) {
			const searchEnv = arguments[0];
			return super.query.call(this, searchEnv);
		} else if (arguments.length === 2) {
			const searchEnv = arguments[0], visitor = arguments[1];
			super.query.call(this, searchEnv, visitor);
		}
	}
	getComparator() {
		return STRtree.yComparator;
	}
	createParentBoundablesFromVerticalSlice(childBoundables, newLevel) {
		return super.createParentBoundables.call(this, childBoundables, newLevel);
	}
	remove() {
		if (arguments.length === 2 && arguments[1] instanceof Object && arguments[0] instanceof Envelope) {
			const itemEnv = arguments[0], item = arguments[1];
			return super.remove.call(this, itemEnv, item);
		} else return super.remove.apply(this, arguments);
	}
	depth() {
		if (arguments.length === 0) return super.depth.call(this);
		else return super.depth.apply(this, arguments);
	}
	createParentBoundables(childBoundables, newLevel) {
		Assert.isTrue(!childBoundables.isEmpty());
		const minLeafCount = Math.trunc(Math.ceil(childBoundables.size() / this.getNodeCapacity()));
		const sortedChildBoundables = new ArrayList(childBoundables);
		Collections.sort(sortedChildBoundables, STRtree.xComparator);
		const verticalSlices = this.verticalSlices(sortedChildBoundables, Math.trunc(Math.ceil(Math.sqrt(minLeafCount))));
		return this.createParentBoundablesFromVerticalSlices(verticalSlices, newLevel);
	}
	nearestNeighbour() {
		if (arguments.length === 1) {
			if (hasInterface_default(arguments[0], ItemDistance)) {
				const itemDist = arguments[0];
				if (this.isEmpty()) return null;
				const bp = new BoundablePair(this.getRoot(), this.getRoot(), itemDist);
				return this.nearestNeighbour(bp);
			} else if (arguments[0] instanceof BoundablePair) {
				const initBndPair = arguments[0];
				let distanceLowerBound = Double.POSITIVE_INFINITY;
				let minPair = null;
				const priQ = new PriorityQueue();
				priQ.add(initBndPair);
				while (!priQ.isEmpty() && distanceLowerBound > 0) {
					const bndPair = priQ.poll();
					const pairDistance = bndPair.getDistance();
					if (pairDistance >= distanceLowerBound) break;
					if (bndPair.isLeaves()) {
						distanceLowerBound = pairDistance;
						minPair = bndPair;
					} else bndPair.expandToQueue(priQ, distanceLowerBound);
				}
				if (minPair === null) return null;
				return [minPair.getBoundable(0).getItem(), minPair.getBoundable(1).getItem()];
			}
		} else if (arguments.length === 2) {
			const tree = arguments[0], itemDist = arguments[1];
			if (this.isEmpty() || tree.isEmpty()) return null;
			const bp = new BoundablePair(this.getRoot(), tree.getRoot(), itemDist);
			return this.nearestNeighbour(bp);
		} else if (arguments.length === 3) {
			const env = arguments[0], item = arguments[1], itemDist = arguments[2];
			const bnd = new ItemBoundable(env, item);
			const bp = new BoundablePair(this.getRoot(), bnd, itemDist);
			return this.nearestNeighbour(bp)[0];
		} else if (arguments.length === 4) {
			const env = arguments[0], item = arguments[1], itemDist = arguments[2], k = arguments[3];
			const bnd = new ItemBoundable(env, item);
			const bp = new BoundablePair(this.getRoot(), bnd, itemDist);
			return this.nearestNeighbourK(bp, k);
		}
	}
	isWithinDistance() {
		if (arguments.length === 2) {
			const initBndPair = arguments[0], maxDistance = arguments[1];
			let distanceUpperBound = Double.POSITIVE_INFINITY;
			const priQ = new PriorityQueue();
			priQ.add(initBndPair);
			while (!priQ.isEmpty()) {
				const bndPair = priQ.poll();
				const pairDistance = bndPair.getDistance();
				if (pairDistance > maxDistance) return false;
				if (bndPair.maximumDistance() <= maxDistance) return true;
				if (bndPair.isLeaves()) {
					distanceUpperBound = pairDistance;
					if (distanceUpperBound <= maxDistance) return true;
				} else bndPair.expandToQueue(priQ, distanceUpperBound);
			}
			return false;
		} else if (arguments.length === 3) {
			const tree = arguments[0], itemDist = arguments[1], maxDistance = arguments[2];
			const bp = new BoundablePair(this.getRoot(), tree.getRoot(), itemDist);
			return this.isWithinDistance(bp, maxDistance);
		}
	}
	createParentBoundablesFromVerticalSlices(verticalSlices, newLevel) {
		Assert.isTrue(verticalSlices.length > 0);
		const parentBoundables = new ArrayList();
		for (let i = 0; i < verticalSlices.length; i++) parentBoundables.addAll(this.createParentBoundablesFromVerticalSlice(verticalSlices[i], newLevel));
		return parentBoundables;
	}
	nearestNeighbourK() {
		if (arguments.length === 2) {
			const initBndPair = arguments[0], k = arguments[1];
			return this.nearestNeighbourK(initBndPair, Double.POSITIVE_INFINITY, k);
		} else if (arguments.length === 3) {
			const initBndPair = arguments[0], maxDistance = arguments[1], k = arguments[2];
			let distanceLowerBound = maxDistance;
			const priQ = new PriorityQueue();
			priQ.add(initBndPair);
			const kNearestNeighbors = new PriorityQueue();
			while (!priQ.isEmpty() && distanceLowerBound >= 0) {
				const bndPair = priQ.poll();
				const pairDistance = bndPair.getDistance();
				if (pairDistance >= distanceLowerBound) break;
				if (bndPair.isLeaves()) if (kNearestNeighbors.size() < k) kNearestNeighbors.add(bndPair);
				else {
					if (kNearestNeighbors.peek().getDistance() > pairDistance) {
						kNearestNeighbors.poll();
						kNearestNeighbors.add(bndPair);
					}
					distanceLowerBound = kNearestNeighbors.peek().getDistance();
				}
				else bndPair.expandToQueue(priQ, distanceLowerBound);
			}
			return STRtree.getItems(kNearestNeighbors);
		}
	}
	createNode(level) {
		return new STRtreeNode(level);
	}
	get interfaces_() {
		return [SpatialIndex, Serializable];
	}
};
var STRtreeNode = class STRtreeNode extends AbstractNode {
	constructor() {
		super();
		STRtreeNode.constructor_.apply(this, arguments);
	}
	static constructor_() {
		const level = arguments[0];
		AbstractNode.constructor_.call(this, level);
	}
	computeBounds() {
		let bounds = null;
		for (let i = this.getChildBoundables().iterator(); i.hasNext();) {
			const childBoundable = i.next();
			if (bounds === null) bounds = new Envelope(childBoundable.getBounds());
			else bounds.expandToInclude(childBoundable.getBounds());
		}
		return bounds;
	}
};
STRtree.STRtreeNode = STRtreeNode;
STRtree.xComparator = new class {
	get interfaces_() {
		return [Comparator];
	}
	compare(o1, o2) {
		return AbstractSTRtree.compareDoubles(STRtree.centreX(o1.getBounds()), STRtree.centreX(o2.getBounds()));
	}
}();
STRtree.yComparator = new class {
	get interfaces_() {
		return [Comparator];
	}
	compare(o1, o2) {
		return AbstractSTRtree.compareDoubles(STRtree.centreY(o1.getBounds()), STRtree.centreY(o2.getBounds()));
	}
}();
STRtree.intersectsOp = new class {
	get interfaces_() {
		return [IntersectsOp];
	}
	intersects(aBounds, bBounds) {
		return aBounds.intersects(bBounds);
	}
}();
STRtree.DEFAULT_NODE_CAPACITY = 10;
// node_modules/jsts/org/locationtech/jts/operation/valid/IndexedNestedRingTester.js
var IndexedNestedRingTester = class IndexedNestedRingTester {
	constructor() {
		IndexedNestedRingTester.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._graph = null;
		this._rings = new ArrayList();
		this._totalEnv = new Envelope();
		this._index = null;
		this._nestedPt = null;
		const graph = arguments[0];
		this._graph = graph;
	}
	add(ring) {
		this._rings.add(ring);
		this._totalEnv.expandToInclude(ring.getEnvelopeInternal());
	}
	getNestedPoint() {
		return this._nestedPt;
	}
	buildIndex() {
		this._index = new STRtree();
		for (let i = 0; i < this._rings.size(); i++) {
			const ring = this._rings.get(i);
			const env = ring.getEnvelopeInternal();
			this._index.insert(env, ring);
		}
	}
	isNonNested() {
		this.buildIndex();
		for (let i = 0; i < this._rings.size(); i++) {
			const innerRing = this._rings.get(i);
			const innerRingPts = innerRing.getCoordinates();
			const results = this._index.query(innerRing.getEnvelopeInternal());
			for (let j = 0; j < results.size(); j++) {
				const searchRing = results.get(j);
				const searchRingPts = searchRing.getCoordinates();
				if (innerRing === searchRing) continue;
				if (!innerRing.getEnvelopeInternal().intersects(searchRing.getEnvelopeInternal())) continue;
				const innerRingPt = IsValidOp.findPtNotNode(innerRingPts, searchRing, this._graph);
				if (innerRingPt === null) continue;
				if (PointLocation.isInRing(innerRingPt, searchRingPts)) {
					this._nestedPt = innerRingPt;
					return false;
				}
			}
		}
		return true;
	}
};
// node_modules/jsts/org/locationtech/jts/operation/valid/TopologyValidationError.js
var TopologyValidationError = class TopologyValidationError {
	constructor() {
		TopologyValidationError.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._errorType = null;
		this._pt = null;
		if (arguments.length === 1) {
			const errorType = arguments[0];
			TopologyValidationError.constructor_.call(this, errorType, null);
		} else if (arguments.length === 2) {
			const errorType = arguments[0], pt = arguments[1];
			this._errorType = errorType;
			if (pt !== null) this._pt = pt.copy();
		}
	}
	getCoordinate() {
		return this._pt;
	}
	getMessage() {
		return TopologyValidationError.errMsg[this._errorType];
	}
	toString() {
		let locStr = "";
		if (this._pt !== null) locStr = " at or near point " + this._pt;
		return this.getMessage() + locStr;
	}
	getErrorType() {
		return this._errorType;
	}
};
TopologyValidationError.ERROR = 0;
TopologyValidationError.REPEATED_POINT = 1;
TopologyValidationError.HOLE_OUTSIDE_SHELL = 2;
TopologyValidationError.NESTED_HOLES = 3;
TopologyValidationError.DISCONNECTED_INTERIOR = 4;
TopologyValidationError.SELF_INTERSECTION = 5;
TopologyValidationError.RING_SELF_INTERSECTION = 6;
TopologyValidationError.NESTED_SHELLS = 7;
TopologyValidationError.DUPLICATE_RINGS = 8;
TopologyValidationError.TOO_FEW_POINTS = 9;
TopologyValidationError.INVALID_COORDINATE = 10;
TopologyValidationError.RING_NOT_CLOSED = 11;
TopologyValidationError.errMsg = [
	"Topology Validation Error",
	"Repeated Point",
	"Hole lies outside shell",
	"Holes are nested",
	"Interior is disconnected",
	"Self-intersection",
	"Ring Self-intersection",
	"Nested shells",
	"Duplicate Rings",
	"Too few distinct points in geometry component",
	"Invalid Coordinate",
	"Ring is not closed"
];
// node_modules/jsts/org/locationtech/jts/operation/valid/IsValidOp.js
var IsValidOp = class IsValidOp {
	constructor() {
		IsValidOp.constructor_.apply(this, arguments);
	}
	static constructor_() {
		this._parentGeometry = null;
		this._isSelfTouchingRingFormingHoleValid = false;
		this._validErr = null;
		const parentGeometry = arguments[0];
		this._parentGeometry = parentGeometry;
	}
	static findPtNotNode(testCoords, searchRing, graph) {
		const eiList = graph.findEdge(searchRing).getEdgeIntersectionList();
		for (let i = 0; i < testCoords.length; i++) {
			const pt = testCoords[i];
			if (!eiList.isIntersection(pt)) return pt;
		}
		return null;
	}
	static isValid() {
		if (arguments[0] instanceof Geometry) {
			const geom = arguments[0];
			return new IsValidOp(geom).isValid();
		} else if (arguments[0] instanceof Coordinate) {
			const coord = arguments[0];
			if (Double.isNaN(coord.x)) return false;
			if (Double.isInfinite(coord.x)) return false;
			if (Double.isNaN(coord.y)) return false;
			if (Double.isInfinite(coord.y)) return false;
			return true;
		}
	}
	checkInvalidCoordinates() {
		if (arguments[0] instanceof Array) {
			const coords = arguments[0];
			for (let i = 0; i < coords.length; i++) if (!IsValidOp.isValid(coords[i])) {
				this._validErr = new TopologyValidationError(TopologyValidationError.INVALID_COORDINATE, coords[i]);
				return null;
			}
		} else if (arguments[0] instanceof Polygon) {
			const poly = arguments[0];
			this.checkInvalidCoordinates(poly.getExteriorRing().getCoordinates());
			if (this._validErr !== null) return null;
			for (let i = 0; i < poly.getNumInteriorRing(); i++) {
				this.checkInvalidCoordinates(poly.getInteriorRingN(i).getCoordinates());
				if (this._validErr !== null) return null;
			}
		}
	}
	checkHolesNotNested(p, graph) {
		if (p.getNumInteriorRing() <= 0) return null;
		const nestedTester = new IndexedNestedRingTester(graph);
		for (let i = 0; i < p.getNumInteriorRing(); i++) {
			const innerHole = p.getInteriorRingN(i);
			if (innerHole.isEmpty()) continue;
			nestedTester.add(innerHole);
		}
		if (!nestedTester.isNonNested()) this._validErr = new TopologyValidationError(TopologyValidationError.NESTED_HOLES, nestedTester.getNestedPoint());
	}
	checkConsistentArea(graph) {
		const cat = new ConsistentAreaTester(graph);
		if (!cat.isNodeConsistentArea()) {
			this._validErr = new TopologyValidationError(TopologyValidationError.SELF_INTERSECTION, cat.getInvalidPoint());
			return null;
		}
		if (cat.hasDuplicateRings()) this._validErr = new TopologyValidationError(TopologyValidationError.DUPLICATE_RINGS, cat.getInvalidPoint());
	}
	isValid() {
		this.checkValid(this._parentGeometry);
		return this._validErr === null;
	}
	checkShellInsideHole(shell, hole, graph) {
		const shellPts = shell.getCoordinates();
		const holePts = hole.getCoordinates();
		const shellPt = IsValidOp.findPtNotNode(shellPts, hole, graph);
		if (shellPt !== null) {
			if (!PointLocation.isInRing(shellPt, holePts)) return shellPt;
		}
		const holePt = IsValidOp.findPtNotNode(holePts, shell, graph);
		if (holePt !== null) {
			if (PointLocation.isInRing(holePt, shellPts)) return holePt;
			return null;
		}
		Assert.shouldNeverReachHere("points in shell and hole appear to be equal");
		return null;
	}
	checkNoSelfIntersectingRings(graph) {
		for (let i = graph.getEdgeIterator(); i.hasNext();) {
			const e = i.next();
			this.checkNoSelfIntersectingRing(e.getEdgeIntersectionList());
			if (this._validErr !== null) return null;
		}
	}
	checkHolesInShell(p, graph) {
		if (p.getNumInteriorRing() <= 0) return null;
		const shell = p.getExteriorRing();
		const isShellEmpty = shell.isEmpty();
		const pir = new IndexedPointInAreaLocator(shell);
		for (let i = 0; i < p.getNumInteriorRing(); i++) {
			const hole = p.getInteriorRingN(i);
			let holePt = null;
			if (hole.isEmpty()) continue;
			holePt = IsValidOp.findPtNotNode(hole.getCoordinates(), shell, graph);
			if (holePt === null) return null;
			if (isShellEmpty || Location.EXTERIOR === pir.locate(holePt)) {
				this._validErr = new TopologyValidationError(TopologyValidationError.HOLE_OUTSIDE_SHELL, holePt);
				return null;
			}
		}
	}
	checkShellNotNested(shell, p, graph) {
		const shellPts = shell.getCoordinates();
		const polyShell = p.getExteriorRing();
		if (polyShell.isEmpty()) return null;
		const polyPts = polyShell.getCoordinates();
		const shellPt = IsValidOp.findPtNotNode(shellPts, polyShell, graph);
		if (shellPt === null) return null;
		if (!PointLocation.isInRing(shellPt, polyPts)) return null;
		if (p.getNumInteriorRing() <= 0) {
			this._validErr = new TopologyValidationError(TopologyValidationError.NESTED_SHELLS, shellPt);
			return null;
		}
		let badNestedPt = null;
		for (let i = 0; i < p.getNumInteriorRing(); i++) {
			const hole = p.getInteriorRingN(i);
			badNestedPt = this.checkShellInsideHole(shell, hole, graph);
			if (badNestedPt === null) return null;
		}
		this._validErr = new TopologyValidationError(TopologyValidationError.NESTED_SHELLS, badNestedPt);
	}
	checkClosedRings(poly) {
		this.checkClosedRing(poly.getExteriorRing());
		if (this._validErr !== null) return null;
		for (let i = 0; i < poly.getNumInteriorRing(); i++) {
			this.checkClosedRing(poly.getInteriorRingN(i));
			if (this._validErr !== null) return null;
		}
	}
	checkConnectedInteriors(graph) {
		const cit = new ConnectedInteriorTester(graph);
		if (!cit.isInteriorsConnected()) this._validErr = new TopologyValidationError(TopologyValidationError.DISCONNECTED_INTERIOR, cit.getCoordinate());
	}
	checkNoSelfIntersectingRing(eiList) {
		const nodeSet = new TreeSet();
		let isFirst = true;
		for (let i = eiList.iterator(); i.hasNext();) {
			const ei = i.next();
			if (isFirst) {
				isFirst = false;
				continue;
			}
			if (nodeSet.contains(ei.coord)) {
				this._validErr = new TopologyValidationError(TopologyValidationError.RING_SELF_INTERSECTION, ei.coord);
				return null;
			} else nodeSet.add(ei.coord);
		}
	}
	checkTooFewPoints(graph) {
		if (graph.hasTooFewPoints()) {
			this._validErr = new TopologyValidationError(TopologyValidationError.TOO_FEW_POINTS, graph.getInvalidPoint());
			return null;
		}
	}
	getValidationError() {
		this.checkValid(this._parentGeometry);
		return this._validErr;
	}
	checkValid() {
		if (arguments[0] instanceof Point) {
			const g = arguments[0];
			this.checkInvalidCoordinates(g.getCoordinates());
		} else if (arguments[0] instanceof MultiPoint) {
			const g = arguments[0];
			this.checkInvalidCoordinates(g.getCoordinates());
		} else if (arguments[0] instanceof LinearRing) {
			const g = arguments[0];
			this.checkInvalidCoordinates(g.getCoordinates());
			if (this._validErr !== null) return null;
			this.checkClosedRing(g);
			if (this._validErr !== null) return null;
			const graph = new GeometryGraph(0, g);
			this.checkTooFewPoints(graph);
			if (this._validErr !== null) return null;
			const li = new RobustLineIntersector();
			graph.computeSelfNodes(li, true, true);
			this.checkNoSelfIntersectingRings(graph);
		} else if (arguments[0] instanceof LineString) {
			const g = arguments[0];
			this.checkInvalidCoordinates(g.getCoordinates());
			if (this._validErr !== null) return null;
			const graph = new GeometryGraph(0, g);
			this.checkTooFewPoints(graph);
		} else if (arguments[0] instanceof Polygon) {
			const g = arguments[0];
			this.checkInvalidCoordinates(g);
			if (this._validErr !== null) return null;
			this.checkClosedRings(g);
			if (this._validErr !== null) return null;
			const graph = new GeometryGraph(0, g);
			this.checkTooFewPoints(graph);
			if (this._validErr !== null) return null;
			this.checkConsistentArea(graph);
			if (this._validErr !== null) return null;
			if (!this._isSelfTouchingRingFormingHoleValid) {
				this.checkNoSelfIntersectingRings(graph);
				if (this._validErr !== null) return null;
			}
			this.checkHolesInShell(g, graph);
			if (this._validErr !== null) return null;
			this.checkHolesNotNested(g, graph);
			if (this._validErr !== null) return null;
			this.checkConnectedInteriors(graph);
		} else if (arguments[0] instanceof MultiPolygon) {
			const g = arguments[0];
			for (let i = 0; i < g.getNumGeometries(); i++) {
				const p = g.getGeometryN(i);
				this.checkInvalidCoordinates(p);
				if (this._validErr !== null) return null;
				this.checkClosedRings(p);
				if (this._validErr !== null) return null;
			}
			const graph = new GeometryGraph(0, g);
			this.checkTooFewPoints(graph);
			if (this._validErr !== null) return null;
			this.checkConsistentArea(graph);
			if (this._validErr !== null) return null;
			if (!this._isSelfTouchingRingFormingHoleValid) {
				this.checkNoSelfIntersectingRings(graph);
				if (this._validErr !== null) return null;
			}
			for (let i = 0; i < g.getNumGeometries(); i++) {
				const p = g.getGeometryN(i);
				this.checkHolesInShell(p, graph);
				if (this._validErr !== null) return null;
			}
			for (let i = 0; i < g.getNumGeometries(); i++) {
				const p = g.getGeometryN(i);
				this.checkHolesNotNested(p, graph);
				if (this._validErr !== null) return null;
			}
			this.checkShellsNotNested(g, graph);
			if (this._validErr !== null) return null;
			this.checkConnectedInteriors(graph);
		} else if (arguments[0] instanceof GeometryCollection) {
			const gc = arguments[0];
			for (let i = 0; i < gc.getNumGeometries(); i++) {
				const g = gc.getGeometryN(i);
				this.checkValid(g);
				if (this._validErr !== null) return null;
			}
		} else if (arguments[0] instanceof Geometry) {
			const g = arguments[0];
			this._validErr = null;
			if (g.isEmpty()) return null;
			if (g instanceof Point) this.checkValid(g);
			else if (g instanceof MultiPoint) this.checkValid(g);
			else if (g instanceof LinearRing) this.checkValid(g);
			else if (g instanceof LineString) this.checkValid(g);
			else if (g instanceof Polygon) this.checkValid(g);
			else if (g instanceof MultiPolygon) this.checkValid(g);
			else if (g instanceof GeometryCollection) this.checkValid(g);
			else throw new UnsupportedOperationException(g.getGeometryType());
		}
	}
	setSelfTouchingRingFormingHoleValid(isValid) {
		this._isSelfTouchingRingFormingHoleValid = isValid;
	}
	checkClosedRing(ring) {
		if (ring.isEmpty()) return null;
		if (!ring.isClosed()) {
			let pt = null;
			if (ring.getNumPoints() >= 1) pt = ring.getCoordinateN(0);
			this._validErr = new TopologyValidationError(TopologyValidationError.RING_NOT_CLOSED, pt);
		}
	}
	checkShellsNotNested(mp, graph) {
		for (let i = 0; i < mp.getNumGeometries(); i++) {
			const shell = mp.getGeometryN(i).getExteriorRing();
			for (let j = 0; j < mp.getNumGeometries(); j++) {
				if (i === j) continue;
				const p2 = mp.getGeometryN(j);
				this.checkShellNotNested(shell, p2, graph);
				if (this._validErr !== null) return null;
			}
		}
	}
};
export { GeoJSONReader, IsValidOp };
