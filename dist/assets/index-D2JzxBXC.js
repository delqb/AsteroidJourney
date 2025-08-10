(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled2 = function(promises) {
      return Promise.all(
        promises.map(
          (p) => Promise.resolve(p).then(
            (value) => ({ status: "fulfilled", value }),
            (reason) => ({ status: "rejected", reason })
          )
        )
      );
    };
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled2(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
class CoreRuntime {
  static __instance = null;
  static initialize(instance) {
    if (CoreRuntime.__instance) {
      throw new Error("Core is already initialized.");
    }
    CoreRuntime.__instance = instance;
  }
  static getInstance() {
    if (!CoreRuntime.__instance) {
      throw new Error("Core is not initialized.");
    }
    return CoreRuntime.__instance;
  }
  static nullifyInstance() {
    if (!CoreRuntime.__instance) {
      throw new Error("Core is not initialized; instance is already nullified.");
    }
    CoreRuntime.__instance = null;
  }
}
class FluidArchetype {
  bitSet;
  constructor(bitSet = 0n) {
    this.bitSet = bitSet;
  }
  static validateNumericId(numId) {
    if (numId < 0 || numId > 1023) {
      throw new RangeError(`Component ID ${numId} is out of supported bitmask bounds.`);
    }
    return numId;
  }
  static getBitPosition(componentType) {
    return BigInt(FluidArchetype.validateNumericId(componentType.getId().getNumericId()));
  }
  static getBitMask(componentType) {
    return 1n << FluidArchetype.getBitPosition(componentType);
  }
  static computeArchetypeBitSet(componentTypes) {
    let bitSet = 0n;
    for (const componentType of componentTypes) {
      bitSet |= FluidArchetype.getBitMask(componentType);
    }
    return bitSet;
  }
  getBitSet() {
    return this.bitSet;
  }
  has(componentType) {
    return (this.bitSet & FluidArchetype.getBitMask(componentType)) !== 0n;
  }
  equals(other) {
    return other instanceof FluidArchetype && other.bitSet === this.bitSet;
  }
  isSuperSetOf(other) {
    return other instanceof FluidArchetype && (this.bitSet & other.bitSet) === other.bitSet;
  }
  with(componentType) {
    return new FluidArchetype(this.bitSet | FluidArchetype.getBitMask(componentType));
  }
  without(componentType) {
    return new FluidArchetype(this.bitSet & ~FluidArchetype.getBitMask(componentType));
  }
}
class FluidArchetypeRegistry {
  map = /* @__PURE__ */ new Map();
  has(bitSet) {
    return this.map.has(bitSet);
  }
  get(bitSet) {
    if (!this.map.has(bitSet)) {
      throw new Error(`Could not retrieve archetype with bitset '${bitSet.toString()}'. Not found.`);
    }
    return this.map.get(bitSet);
  }
  getOrCreate(bitSet) {
    let archetype = this.map.get(bitSet);
    if (!archetype) {
      archetype = new FluidArchetype(bitSet);
      this.map.set(bitSet, archetype);
    }
    return archetype;
  }
  add(archetype) {
    this.map.set(archetype.getBitSet(), archetype);
  }
  remove(bitSet) {
    if (!this.map.delete(bitSet)) {
      throw new Error(`Could not remove archetype with bitset '${bitSet.toString()}'. Not found.`);
    }
  }
}
class FluidComponent {
  componentTypeId;
  data;
  constructor(componentTypeId, data) {
    this.componentTypeId = componentTypeId;
    this.data = data;
  }
}
class FluidComponentFactory {
  createComponent(componentType, componentData, copyData) {
    return new FluidComponent(componentType.getId(), copyData ? { ...componentData } : componentData);
  }
}
class FluidComponentManager {
  componentTypeFactory;
  componentTypeRegistry;
  componentTypeResolver;
  componentFactory;
  componentRepository;
  constructor(componentTypeFactory, componentTypeRegistry, componentTypeResolver, componentFactory, componentRepository) {
    this.componentTypeFactory = componentTypeFactory;
    this.componentTypeRegistry = componentTypeRegistry;
    this.componentTypeResolver = componentTypeResolver;
    this.componentFactory = componentFactory;
    this.componentRepository = componentRepository;
  }
  getComponentTypeResolver() {
    return this.componentTypeResolver;
  }
  getComponentTypeFactory() {
    return this.componentTypeFactory;
  }
  getComponentTypeRegistry() {
    return this.componentTypeRegistry;
  }
  getComponentFactory() {
    return this.componentFactory;
  }
  getComponentRepository() {
    return this.componentRepository;
  }
}
class FluidComponentRepository {
  getComponentType;
  hooks;
  static EMPTY_COMPONENT_TYPES = Object.freeze([]);
  // Maps component type symbol -> (entity symbol -> component)
  componentTypeToComponentMap = /* @__PURE__ */ new Map();
  // Maps entity symbol -> (component type symbol -> component type)
  entityToComponentTypesMap = /* @__PURE__ */ new Map();
  constructor(getComponentType, hooks) {
    this.getComponentType = getComponentType;
    this.hooks = hooks;
  }
  getEntityComponentMap(componentType) {
    const typeId = componentType.getId();
    const typeSymbol = typeId.getSymbol();
    const typeName = typeId.getName();
    const componentMap = this.componentTypeToComponentMap.get(typeSymbol);
    if (!componentMap) {
      throw new Error(`Could not find component with type '${typeName}' in repository: the component type key was not found in map.`);
    }
    return componentMap;
  }
  withComponentEntry(componentType, entityId, operation) {
    const entitySymbol = entityId.getSymbol();
    const typeName = componentType.getId().getName();
    const componentMap = this.getEntityComponentMap(componentType);
    const component = componentMap.get(entitySymbol);
    if (!component) {
      throw new Error(`Could not find a component with type '${typeName}' from repository: entity '${entityId.toString()}' is not associated with a component of this type.`);
    }
    return operation(componentMap, entitySymbol);
  }
  removeComponentType(typeSymbol, entitySymbol) {
    const typesMap = this.entityToComponentTypesMap.get(entitySymbol);
    if (typesMap) {
      typesMap.delete(typeSymbol);
      if (typesMap.size === 0) {
        this.entityToComponentTypesMap.delete(entitySymbol);
      }
    }
  }
  addComponentType(componentType, entitySymbol) {
    const typeSymbol = componentType.getId().getSymbol();
    let componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
    if (!componentTypesMap) {
      componentTypesMap = /* @__PURE__ */ new Map();
      this.entityToComponentTypesMap.set(entitySymbol, componentTypesMap);
    }
    componentTypesMap.set(typeSymbol, componentType);
  }
  hasComponent(componentType, entityId) {
    const typeSymbol = componentType.getId().getSymbol();
    const entitySymbol = entityId.getSymbol();
    const innerMap = this.componentTypeToComponentMap.get(typeSymbol);
    return innerMap?.has(entitySymbol) ?? false;
  }
  getComponent(componentType, entityId) {
    return this.withComponentEntry(componentType, entityId, (map, key) => map.get(key));
  }
  addComponent(component, entityId) {
    const typeId = component.componentTypeId;
    const componentType = this.getComponentType(typeId);
    const typeSymbol = typeId.getSymbol();
    const typeName = typeId.getName();
    const entitySymbol = entityId.getSymbol();
    let componentMap = this.componentTypeToComponentMap.get(typeSymbol);
    if (componentMap && componentMap.has(entitySymbol)) {
      throw new Error(`Could not add component with type '${typeName}' to repository: entity '${entityId.toString()}' is already associated with a component of this type.`);
    }
    if (!componentMap) {
      componentMap = /* @__PURE__ */ new Map();
      this.componentTypeToComponentMap.set(typeSymbol, componentMap);
    }
    componentMap.set(entitySymbol, component);
    this.addComponentType(componentType, entitySymbol);
    this.hooks.invokeHooks((h) => h.onAddComponent(componentType, component, entityId));
  }
  removeComponent(componentType, entityId) {
    const typeId = componentType.getId();
    const typeSymbol = typeId.getSymbol();
    const entitySymbol = entityId.getSymbol();
    const component = this.withComponentEntry(componentType, entityId, (map, key) => {
      const c = map.get(key);
      map.delete(key);
      if (map.size === 0) {
        this.componentTypeToComponentMap.delete(typeSymbol);
      }
      return c;
    });
    this.removeComponentType(typeSymbol, entitySymbol);
    this.hooks.invokeHooks((h) => h.onRemoveComponent(componentType, component, entityId));
  }
  hasEntity(entityId) {
    return this.entityToComponentTypesMap.has(entityId.getSymbol());
  }
  getEntityComponentTypes(entityId) {
    const entitySymbol = entityId.getSymbol();
    const componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
    return componentTypesMap ? Array.from(componentTypesMap.values()) : FluidComponentRepository.EMPTY_COMPONENT_TYPES;
  }
  removeEntityComponents(entityId) {
    const entitySymbol = entityId.getSymbol();
    const componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
    if (!componentTypesMap)
      return;
    const componentTypes = Array.from(componentTypesMap.values());
    this.entityToComponentTypesMap.delete(entitySymbol);
    for (const componentType of componentTypes) {
      const typeSymbol = componentType.getId().getSymbol();
      const component = this.componentTypeToComponentMap.get(typeSymbol)?.get(entitySymbol);
      if (component) {
        this.componentTypeToComponentMap.get(typeSymbol).delete(entitySymbol);
        this.hooks.invokeHooks((h) => h.onRemoveComponent(componentType, component, entityId));
      }
    }
  }
  *getEntityComponents(entityId) {
    const entitySymbol = entityId.getSymbol();
    const componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
    if (componentTypesMap) {
      for (const componentType of componentTypesMap.values()) {
        yield this.withComponentEntry(componentType, entityId, (map, key) => map.get(key));
      }
    }
  }
}
class FluidComponentType {
  id;
  factory;
  constructor(id, factory) {
    this.id = id;
    this.factory = factory;
  }
  getId() {
    return this.id;
  }
  is(component) {
    return this.id.equals(component.componentTypeId);
  }
  createComponent(data, copyData = false) {
    return this.factory.createComponent(this, data, copyData);
  }
}
class FluidComponentTypeId {
  name;
  numericId;
  static prefix = "FluidComponentType";
  symbolId;
  stringified;
  constructor(name, numericId) {
    this.name = name;
    this.numericId = numericId;
    this.stringified = `${FluidComponentTypeId.prefix}#${numericId}-${name}`;
    this.symbolId = Symbol(this.stringified);
  }
  getSymbol() {
    return this.symbolId;
  }
  getNumericId() {
    return this.numericId;
  }
  getName() {
    return this.name;
  }
  equals(other) {
    return other instanceof FluidComponentTypeId && other.symbolId === this.symbolId;
  }
  toString() {
    return this.stringified;
  }
}
class FluidComponentTypeFactory {
  componentFactory;
  nextNumericId = 0;
  removedNumericIds = /* @__PURE__ */ new Set();
  constructor(componentFactory) {
    this.componentFactory = componentFactory;
  }
  onRegisterComponentType(registry, componentType) {
  }
  onUnregisterComponentType(registry, componentType) {
    this.removedNumericIds.add(componentType.getId().getNumericId());
  }
  createComponentType(name) {
    let numericId;
    if (this.removedNumericIds.size > 0) {
      numericId = this.removedNumericIds.values().next().value;
      this.removedNumericIds.delete(numericId);
    } else {
      numericId = this.nextNumericId++;
    }
    return new FluidComponentType(new FluidComponentTypeId(name, numericId), this.componentFactory);
  }
}
class FluidComponentTypeRegistry {
  hooks;
  map = /* @__PURE__ */ new Map();
  constructor(hooks) {
    this.hooks = hooks;
  }
  hasComponentType(id) {
    return this.map.has(id.getSymbol());
  }
  getComponentType(componentTypeId) {
    const value = this.map.get(componentTypeId.getSymbol());
    if (!value) {
      throw new Error(`Could not retrieve component type '${componentTypeId.toString()}'. This type may not have been registered.`);
    }
    return value;
  }
  removeComponentType(componentTypeId) {
    const idSymbol = componentTypeId.getSymbol();
    const type = this.map.get(idSymbol);
    if (!type) {
      throw new Error(`Could not remove component type '${componentTypeId.toString()}'. This type may not have been registered.`);
    }
    this.map.delete(idSymbol);
    this.hooks.invokeHooks((hook) => hook.onUnregisterComponentType(this, type));
  }
  addComponentType(componentType) {
    const id = componentType.getId();
    const idSymbol = id.getSymbol();
    if (this.map.has(idSymbol)) {
      throw new Error(`Could not register component type '${id.toString()}'. This type has already been registered.`);
    }
    this.map.set(idSymbol, componentType);
    this.hooks.invokeHooks((hook) => hook.onRegisterComponentType(this, componentType));
  }
}
class FluidComponentTypeResolver {
  byNumericId = /* @__PURE__ */ new Map();
  bySymbol = /* @__PURE__ */ new Map();
  getOrThrowError(keyTypeName, key, map) {
    const componentType = map.get(key);
    if (!componentType) {
      throw new Error(`Failed to retrieve component type using key '${String(key)}' of type '${keyTypeName}'.`);
    }
    return componentType;
  }
  setOrThrowError(keyTypeName, key, componentType, map) {
    if (map.has(key)) {
      const existingTypeName = map.get(key).getId().getName();
      throw new Error(`Failed to store component type '${componentType.getId().getName()}' using key '${String(key)}' of type '${keyTypeName}': this key has already been set for component type '${existingTypeName}'`);
    }
    map.set(key, componentType);
  }
  onRegisterComponentType(registry, componentType) {
    const id = componentType.getId();
    this.setOrThrowError("number", id.getNumericId(), componentType, this.byNumericId);
    this.setOrThrowError("symbol", id.getSymbol(), componentType, this.bySymbol);
  }
  onUnregisterComponentType(registry, componentType) {
    const id = componentType.getId();
    this.byNumericId.delete(id.getNumericId());
    this.bySymbol.delete(id.getSymbol());
  }
  getBySymbol(symId) {
    return this.getOrThrowError("symbol", symId, this.bySymbol);
  }
  getByNumericId(numId) {
    return this.getOrThrowError("number", numId, this.byNumericId);
  }
}
class FluidEntityArchetypeCoordinator {
  archetypeRegistry;
  getEntityComponentTypes;
  entityArchetypeHooks;
  archetypeMap = /* @__PURE__ */ new Map();
  constructor(archetypeRegistry, getEntityComponentTypes, entityArchetypeHooks) {
    this.archetypeRegistry = archetypeRegistry;
    this.getEntityComponentTypes = getEntityComponentTypes;
    this.entityArchetypeHooks = entityArchetypeHooks;
  }
  computeArchetypeBitSet(entityId) {
    const componentTypeIterable = this.getEntityComponentTypes(entityId);
    return FluidArchetype.computeArchetypeBitSet(componentTypeIterable);
  }
  getArchetypeOfEntity(entityId) {
    const idSymbol = entityId.getSymbol();
    if (this.archetypeMap.has(idSymbol)) {
      return this.archetypeMap.get(idSymbol);
    }
    const bitSet = this.computeArchetypeBitSet(entityId);
    const archetype = this.archetypeRegistry.getOrCreate(bitSet);
    this.archetypeMap.set(idSymbol, archetype);
    return archetype;
  }
  onAddComponent(componentType, component, entityId) {
    const idSymbol = entityId.getSymbol();
    const currentBitSet = this.archetypeMap.get(idSymbol)?.getBitSet() ?? this.computeArchetypeBitSet(entityId);
    const currentArchetype = this.archetypeRegistry.getOrCreate(currentBitSet);
    const newBitSet = currentBitSet | FluidArchetype.getBitMask(componentType);
    const newArchetype = this.archetypeRegistry.getOrCreate(newBitSet);
    this.archetypeMap.set(idSymbol, newArchetype);
    this.entityArchetypeHooks.invokeHooks((h) => h.onEntityArchetypeExpansion(entityId, componentType, currentArchetype, newArchetype));
  }
  onRemoveComponent(componentType, component, entityId) {
    const idSymbol = entityId.getSymbol();
    const currentBitSet = this.archetypeMap.get(idSymbol)?.getBitSet() ?? this.computeArchetypeBitSet(entityId);
    const currentArchetype = this.archetypeRegistry.getOrCreate(currentBitSet);
    const newBitSet = currentBitSet & ~FluidArchetype.getBitMask(componentType);
    const newArchetype = this.archetypeRegistry.getOrCreate(newBitSet);
    this.archetypeMap.set(idSymbol, newArchetype);
    this.entityArchetypeHooks.invokeHooks((h) => h.onEntityArchetypeReduction(entityId, componentType, currentArchetype, newArchetype));
  }
}
class FluidEntityId {
  stringId;
  symbol;
  constructor(stringId) {
    this.stringId = stringId;
    this.symbol = Symbol(this.stringId);
  }
  getSymbol() {
    return this.symbol;
  }
  equals(other) {
    return other instanceof FluidEntityId ? other.symbol === this.symbol : other.toString() === this.toString();
  }
  toString() {
    return this.stringId;
  }
}
class FluidEntityFactory {
  static prefix = "FluidEntity";
  tag;
  constructor() {
    this.tag = `${FluidEntityFactory.prefix}_`;
  }
  createEntityId() {
    const tag = this.tag;
    const stringId = tag + Date.now();
    return new FluidEntityId(stringId);
  }
}
class FluidEntityManager {
  entityFactory;
  proxyFactory;
  idMap = /* @__PURE__ */ new Map();
  proxyMap = /* @__PURE__ */ new Map();
  constructor(entityFactory, proxyFactory) {
    this.entityFactory = entityFactory;
    this.proxyFactory = proxyFactory;
  }
  getEntityBySymbol(entitySymbol) {
    return this.idMap.get(entitySymbol);
  }
  getEntityResolver() {
    return this;
  }
  getEntityFactory() {
    return this.entityFactory;
  }
  getEntityProxyFactory() {
    return this.proxyFactory;
  }
  getEntities() {
    return this.idMap.values();
  }
  hasEntity(entityId) {
    return this.idMap.has(entityId.getSymbol());
  }
  removeEntity(entityId) {
    this.idMap.delete(entityId.getSymbol());
    this.proxyMap.delete(entityId.getSymbol());
  }
  addEntity(entityId) {
    this.idMap.set(entityId.getSymbol(), entityId);
  }
  createEntity() {
    const id = this.entityFactory.createEntityId();
    this.addEntity(id);
    return id;
  }
  getEntityProxy(entityId) {
    const key = entityId.getSymbol();
    let proxy = this.proxyMap.get(key);
    if (!proxy) {
      proxy = this.proxyFactory.createProxy(entityId);
      this.proxyMap.set(key, proxy);
    }
    return proxy;
  }
}
class FluidEntityProxy {
  entityId;
  componentRepository;
  constructor(entityId, componentRepository) {
    this.entityId = entityId;
    this.componentRepository = componentRepository;
  }
  hasComponent(componentType) {
    return this.componentRepository.hasComponent(componentType, this.entityId);
  }
  getComponent(componentType) {
    return this.componentRepository.getComponent(componentType, this.entityId);
  }
  addComponent(component) {
    this.componentRepository.addComponent(component, this.entityId);
  }
  removeComponent(componentType) {
    this.componentRepository.removeComponent(componentType, this.entityId);
  }
}
class FluidEntityProxyFactory {
  componentRepository;
  constructor(componentRepository) {
    this.componentRepository = componentRepository;
  }
  createProxy(entityId) {
    return new FluidEntityProxy(entityId, this.componentRepository);
  }
}
class FluidNodeFactory {
  getComponent;
  constructor(getComponent) {
    this.getComponent = getComponent;
  }
  createNode(schemaMeta, entityId) {
    const schemaId = schemaMeta.id, schema = schemaMeta.schema;
    const node = { entityId };
    for (const [key, componentType] of Object.entries(schema)) {
      const component = this.getComponent(componentType, entityId);
      if (!component) {
        throw new Error(`Failed to create node from schema '${schemaId.getName()}': could not find component of type '${componentType.getId().getName()}' associated with entity id '${entityId.toString()}'`);
      }
      node[key] = component.data;
    }
    return node;
  }
}
class FluidNodeManager {
  nodeRepository;
  nodeIndex;
  nodeFactory;
  nodeSchemaRegistry;
  getArchetypeOfNodeSchema;
  nodeSchemaIndex;
  constructor(nodeRepository, nodeIndex, nodeFactory, nodeSchemaRegistry, getArchetypeOfNodeSchema, nodeSchemaIndex) {
    this.nodeRepository = nodeRepository;
    this.nodeIndex = nodeIndex;
    this.nodeFactory = nodeFactory;
    this.nodeSchemaRegistry = nodeSchemaRegistry;
    this.getArchetypeOfNodeSchema = getArchetypeOfNodeSchema;
    this.nodeSchemaIndex = nodeSchemaIndex;
  }
  getNodeIndex() {
    return this.nodeIndex;
  }
  getNodeRepository() {
    return this.nodeRepository;
  }
  getNodeFactory() {
    return this.nodeFactory;
  }
  getNodeSchemaRegistry() {
    return this.nodeSchemaRegistry;
  }
  /*
      Archetype Hook Implementation
  */
  onEntityArchetypeExpansion(entityId, addedComponentType, previousArchetype, newArchetype) {
    for (const schemaMeta of this.nodeSchemaIndex.getSchemasWithComponentType(addedComponentType)) {
      const schemaId = schemaMeta.id;
      const schemaArchetype = this.getArchetypeOfNodeSchema(schemaMeta);
      if (!newArchetype.isSuperSetOf(schemaArchetype))
        continue;
      if (this.nodeRepository.hasNode(schemaId, entityId))
        continue;
      try {
        const node = this.nodeFactory.createNode(schemaMeta, entityId);
        this.nodeRepository.addNode(schemaId, node);
      } catch (e) {
        throw new Error(`Failed to create/add node for entity ${entityId.toString()} under schema '${schemaId.getName()}': ${e.message}`, { cause: e });
      }
    }
  }
  onEntityArchetypeReduction(entityId, removedComponentType, previousArchetype, newArchetype) {
    for (const schemaMeta of this.nodeSchemaIndex.getSchemasWithComponentType(removedComponentType)) {
      const schemaId = schemaMeta.id;
      const schemaArchetype = this.getArchetypeOfNodeSchema(schemaMeta);
      if (!newArchetype.isSuperSetOf(schemaArchetype) && this.nodeRepository.hasNode(schemaId, entityId)) {
        this.nodeRepository.removeNode(schemaId, entityId);
      }
    }
  }
}
class FluidNodeRepository {
  static EMPTY_ITERABLE = Object.freeze([]);
  nodeMap = /* @__PURE__ */ new Map();
  constructor() {
  }
  getInnerMap(schemaId) {
    const idSymbol = schemaId.getSymbol();
    const innerMap = this.nodeMap.get(idSymbol);
    if (!innerMap)
      throw new Error(`Failed to retrieve node with schema '${schemaId.getName()}': schema id was not set in node repository.`);
    return innerMap;
  }
  hasNode(schemaId, entityId) {
    const idSymbol = schemaId.getSymbol();
    const innerMap = this.nodeMap.get(idSymbol);
    return innerMap && innerMap.has(entityId);
  }
  getNode(schemaId, entityId) {
    const innerMap = this.getInnerMap(schemaId);
    const node = innerMap.get(entityId);
    if (!node) {
      throw new Error(`Failed to get a node with schema '${schemaId.getName()}' for entity id '${entityId.toString()}': node not found.`);
    }
    return node;
  }
  removeNode(schemaId, entityId) {
    const innerMap = this.getInnerMap(schemaId);
    const node = innerMap.get(entityId);
    if (!node) {
      throw new Error(`Failed to remove a node with schema '${schemaId.getName()}' for entity id '${entityId.toString()}': node not found.`);
    }
    innerMap.delete(entityId);
  }
  hasNodes(schemaId) {
    const idSymbol = schemaId.getSymbol();
    return this.nodeMap.has(idSymbol);
  }
  getNodes(schemaId) {
    const idSymbol = schemaId.getSymbol();
    const innerMap = this.nodeMap.get(idSymbol);
    return innerMap?.values() ?? FluidNodeRepository.EMPTY_ITERABLE;
  }
  removeNodes(schemaId) {
    const idSymbol = schemaId.getSymbol();
    this.nodeMap.delete(idSymbol);
  }
  addNode(schemaId, node) {
    const idSymbol = schemaId.getSymbol();
    let innerMap = this.nodeMap.get(idSymbol);
    if (innerMap && innerMap.has(node.entityId)) {
      throw new Error(`Failed to add node '${node}' with schema '${schemaId.getName()}': a node for this entity already exists under this schema.`);
    }
    if (!innerMap) {
      innerMap = /* @__PURE__ */ new Map();
      this.nodeMap.set(idSymbol, innerMap);
    }
    innerMap.set(node.entityId, node);
  }
  getNodesWithSchema(meta) {
    return this.getNodes(meta.id);
  }
}
class FluidNodeSchemaArchetypeBridge {
  archetypeRegistry;
  schemaArchetypeHooks;
  schemaToArchetypeMap = /* @__PURE__ */ new Map();
  // Maps each schema symbol to its archetype
  constructor(archetypeRegistry, schemaArchetypeHooks) {
    this.archetypeRegistry = archetypeRegistry;
    this.schemaArchetypeHooks = schemaArchetypeHooks;
  }
  computeArchetypeBitSet(schema) {
    return FluidArchetype.computeArchetypeBitSet(Object.values(schema));
  }
  /**
   * Retrieves archetype of schema if cached; otherwise, computes and interns the archetype in the archetype registry and then caches it locally.
   */
  getOrCreateArchetype(meta) {
    const idSymbol = meta.id.getSymbol();
    let archetype = this.schemaToArchetypeMap.get(idSymbol);
    if (archetype) {
      return archetype;
    }
    const bitSet = this.computeArchetypeBitSet(meta.schema);
    archetype = this.archetypeRegistry.getOrCreate(bitSet);
    this.schemaToArchetypeMap.set(idSymbol, archetype);
    this.schemaArchetypeHooks.invokeHooks((h) => h.onRegisterSchemaArchetype(meta, archetype));
    return archetype;
  }
  removeArchetype(meta) {
    const idSymbol = meta.id.getSymbol();
    const archetype = this.schemaToArchetypeMap.get(idSymbol);
    if (archetype) {
      this.schemaToArchetypeMap.delete(idSymbol);
      this.schemaArchetypeHooks.invokeHooks((h) => h.onRemoveSchemaArchetype(meta, archetype));
    }
  }
  onRegisterNodeSchema(meta) {
    this.getOrCreateArchetype(meta);
  }
  onUnregisterNodeSchema(meta) {
    this.removeArchetype(meta);
  }
}
function* getLazyMappedIterable(source, map) {
  for (const item of source) {
    yield map(item);
  }
}
class FluidNodeSchemaIndex {
  getSchemaBySymbol;
  getArchetypeOfSchema;
  archetypeToSchemaMap = /* @__PURE__ */ new Map();
  componentTypeToSchemasMap = /* @__PURE__ */ new Map();
  static EMPTY_SET = Object.freeze(/* @__PURE__ */ new Set());
  constructor(getSchemaBySymbol, getArchetypeOfSchema) {
    this.getSchemaBySymbol = getSchemaBySymbol;
    this.getArchetypeOfSchema = getArchetypeOfSchema;
  }
  onRegisterNodeSchema(meta) {
    const schemaSymbol = meta.id.getSymbol();
    const archetype = this.getArchetypeOfSchema(meta);
    const bitSet = archetype.getBitSet();
    let schemaSet = this.archetypeToSchemaMap.get(bitSet);
    if (!schemaSet) {
      schemaSet = /* @__PURE__ */ new Set();
      this.archetypeToSchemaMap.set(bitSet, schemaSet);
    }
    schemaSet.add(schemaSymbol);
    for (const componentType of Object.values(meta.schema)) {
      const typeSymbol = componentType.getId().getSymbol();
      let schemaSet2 = this.componentTypeToSchemasMap.get(typeSymbol);
      if (!schemaSet2) {
        schemaSet2 = /* @__PURE__ */ new Set();
        this.componentTypeToSchemasMap.set(typeSymbol, schemaSet2);
      }
      schemaSet2.add(schemaSymbol);
    }
  }
  onUnregisterNodeSchema(meta) {
    const schemaSymbol = meta.id.getSymbol();
    const archetype = this.getArchetypeOfSchema(meta);
    const bitSet = archetype.getBitSet();
    const schemaSet = this.archetypeToSchemaMap.get(bitSet);
    if (schemaSet) {
      schemaSet.delete(schemaSymbol);
      if (schemaSet.size == 0)
        this.archetypeToSchemaMap.delete(bitSet);
    }
    for (const componentType of Object.values(meta.schema)) {
      const typeSymbol = componentType.getId().getSymbol();
      let schemaSet2 = this.componentTypeToSchemasMap.get(typeSymbol);
      if (schemaSet2) {
        schemaSet2.delete(schemaSymbol);
        if (schemaSet2.size == 0)
          this.componentTypeToSchemasMap.delete(typeSymbol);
      }
    }
  }
  getLazyResolvedMetaIterable(schemaSymbolSet) {
    return getLazyMappedIterable(schemaSymbolSet ?? FluidNodeSchemaIndex.EMPTY_SET, (symbol) => {
      const schema = this.getSchemaBySymbol(symbol);
      if (!schema)
        throw new Error(`Schema not found for symbol: ${String(symbol)}`);
      return schema;
    });
  }
  getSchemasWithComponentType(componentType) {
    const typeSymbol = componentType.getId().getSymbol();
    const schemaSymbolSet = this.componentTypeToSchemasMap.get(typeSymbol);
    return this.getLazyResolvedMetaIterable(schemaSymbolSet);
  }
  getSchemasWithArchetype(archetype) {
    if (!(archetype instanceof FluidArchetype))
      throw new Error("Unsupported archetype implementation passed to 'FluidNodeSchemaIndex.getSchemasWithArchetype'. Expected 'FluidArchetype'");
    const bitSet = archetype.getBitSet();
    const schemaSymbolSet = this.archetypeToSchemaMap.get(bitSet);
    return this.getLazyResolvedMetaIterable(schemaSymbolSet);
  }
}
class FluidNodeSchemaId {
  idSymbol;
  timeStamp;
  stringified;
  constructor(name) {
    this.timeStamp = Date.now();
    this.stringified = `FluidNodeSchemaId[${this.timeStamp}ms](${name})`;
    this.idSymbol = Symbol(this.stringified);
  }
  equals(other) {
    return other instanceof FluidNodeSchemaId && other.idSymbol === this.idSymbol;
  }
  getName() {
    return this.stringified;
  }
  getSymbol() {
    return this.idSymbol;
  }
}
class FluidNodeSchemaRegistry {
  hooks;
  schemaMap = /* @__PURE__ */ new Map();
  constructor(hooks) {
    this.hooks = hooks;
  }
  hasSchema(schemaId) {
    return this.schemaMap.has(schemaId.getSymbol());
  }
  getSchemaBySymbol(idSymbol) {
    const meta = this.schemaMap.get(idSymbol);
    if (!meta)
      throw new Error(`Could not find schema using symbol.`);
    return meta;
  }
  getSchema(schemaId) {
    const idSymbol = schemaId.getSymbol();
    const meta = this.schemaMap.get(idSymbol);
    if (!meta)
      throw new Error(`Could not find schema '${schemaId.getName()}'`);
    return meta;
  }
  addSchema(schema, name) {
    const id = new FluidNodeSchemaId(name);
    const meta = { id, schema };
    this.schemaMap.set(id.getSymbol(), meta);
    this.hooks.invokeHooks((h) => h.onRegisterNodeSchema(meta));
    return meta;
  }
  removeSchema(schemaId) {
    const idSymbol = schemaId.getSymbol();
    const meta = this.schemaMap.get(idSymbol);
    if (!meta)
      throw new Error(`Could not remove schema '${schemaId.getName()}'`);
    this.schemaMap.delete(idSymbol);
    this.hooks.invokeHooks((h) => h.onUnregisterNodeSchema(meta));
  }
}
class OrderedArrayList {
  compareFn;
  items = [];
  itemSet = /* @__PURE__ */ new Set();
  constructor(initialItems = [], compareFn = (a, b) => a - b) {
    this.compareFn = compareFn;
    this.items = initialItems.slice().sort((a, b) => this.compareFn(a.order, b.order));
  }
  getItemList() {
    return this.items;
  }
  insertItem(entry) {
    const index = this.findInsertionIndex(entry.order);
    this.items.splice(index, 0, entry);
    this.itemSet.add(entry.item);
  }
  // Insert with binary search to maintain order
  insert(item, order) {
    this.insertItem({ item, order });
  }
  has(value) {
    return this.itemSet.has(value);
  }
  // Binary search for insertion point
  findInsertionIndex(order) {
    let left = 0, right = this.items.length;
    while (left < right) {
      const mid = left + right >>> 1;
      if (this.items[mid].order > order) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    return left;
  }
  // Access all in priority order
  getAll() {
    return this.items.map((o) => o.item);
  }
  // Fast lookup by index
  get(index) {
    return this.items[index]?.item;
  }
  remove(value) {
    if (!this.itemSet.has(value))
      return;
    const index = this.items.findIndex((o) => Object.is(o.item, value));
    if (index !== -1)
      this.items.splice(index, 1);
  }
  getSize() {
    return this.items.length;
  }
  clear() {
    this.items.length = 0;
  }
  at(index) {
    return this.items[index];
  }
  entries() {
    return this.items.values();
  }
}
class FluidSystemOrchestrator {
  phaseList = new OrderedArrayList();
  //Store phases in proper order
  hasPhase(phase) {
    return this.phaseList.has(phase);
  }
  addPhase(phase, phaseOrder) {
    if (this.phaseList.has(phase)) {
      throw new Error(`Failed to add phase '${phase.getName()}': phase has already been added.`);
    }
    this.phaseList.insert(phase, phaseOrder);
  }
  pushPhase(phase) {
    this.addPhase(phase, this.phaseList.getSize());
  }
  pushPhases(...phases) {
    phases.forEach((phase) => this.pushPhase(phase));
  }
  removePhase(phase) {
    if (!this.phaseList.has(phase)) {
      throw new Error(`Failed to remove phase '${phase.getName()}': phase has not been added.`);
    }
    this.phaseList.remove(phase);
  }
  getPhases() {
    return this.phaseList.getAll();
  }
  update(nodeIndex) {
    for (const phase of this.phaseList.getAll()) {
      try {
        phase.update(nodeIndex);
      } catch (error) {
        console.error(`Failed to complete phase update '${phase.getName()}':
${error}`);
      }
    }
  }
}
class FluidHookDispatcher {
  hooks = [];
  constructor(hooks = []) {
    hooks.forEach((h) => this.addHook(h));
  }
  addHook(hook) {
    if (this.hooks.includes(hook)) {
      throw new Error(`Cannot add hook: hook is already registered.`);
    }
    this.hooks.push(hook);
  }
  removeHook(hook) {
    const index = this.hooks.indexOf(hook);
    if (index === -1) {
      throw new Error(`Cannot remove hook: hook is not registered.`);
    }
    this.hooks.splice(index, 1);
  }
  invokeHooks(fn) {
    for (const hook of this.hooks) {
      try {
        fn(hook);
      } catch (error) {
        console.error("Hook invocation threw an error:", error);
      }
    }
  }
  hookList() {
    return [...this.hooks];
  }
}
const FLUID_CORE_SYMBOL = Symbol.for("FluidCore");
class FluidCore {
  entityManager;
  componentManager;
  systemOrchestrator;
  nodeManager;
  static bootstrap() {
    const componentTypeRegistryHookDispatcher = new FluidHookDispatcher();
    const componentTypeRegistry = new FluidComponentTypeRegistry(componentTypeRegistryHookDispatcher);
    const componentRepositoryHookDispatcher = new FluidHookDispatcher();
    const componentRepository = new FluidComponentRepository(componentTypeRegistry.getComponentType.bind(componentTypeRegistry), componentRepositoryHookDispatcher);
    const componentFactory = new FluidComponentFactory();
    const componentTypeResolver = new FluidComponentTypeResolver();
    const componentTypeFactory = new FluidComponentTypeFactory(componentFactory);
    const componentManager = new FluidComponentManager(componentTypeFactory, componentTypeRegistry, componentTypeResolver, componentFactory, componentRepository);
    const archetypeRegistry = new FluidArchetypeRegistry();
    const entityArchetypeHookDispatcher = new FluidHookDispatcher();
    const entityArchetypeCoordinator = new FluidEntityArchetypeCoordinator(archetypeRegistry, (entityId) => componentRepository.getEntityComponentTypes(entityId), entityArchetypeHookDispatcher);
    const nodeSchemaArchetypeHookDispatcher = new FluidHookDispatcher();
    const nodeSchemaArchetypeBridge = new FluidNodeSchemaArchetypeBridge(archetypeRegistry, nodeSchemaArchetypeHookDispatcher);
    const nodeRepository = new FluidNodeRepository();
    const nodeFactory = new FluidNodeFactory(componentRepository.getComponent.bind(componentRepository));
    const nodeSchemaRegistryHookDispatcher = new FluidHookDispatcher();
    const nodeSchemaRegistry = new FluidNodeSchemaRegistry(nodeSchemaRegistryHookDispatcher);
    const getNodeSchemaBySymbol = nodeSchemaRegistry.getSchemaBySymbol.bind(nodeSchemaRegistry);
    const getFluidArchetypeOfNodeSchema = nodeSchemaArchetypeBridge.getOrCreateArchetype.bind(nodeSchemaArchetypeBridge);
    const nodeSchemaIndex = new FluidNodeSchemaIndex(getNodeSchemaBySymbol, getFluidArchetypeOfNodeSchema);
    const nodeManager = new FluidNodeManager(nodeRepository, nodeRepository, nodeFactory, nodeSchemaRegistry, getFluidArchetypeOfNodeSchema, nodeSchemaIndex);
    const entityProxyFactory = new FluidEntityProxyFactory(componentRepository);
    const entityManager = new FluidEntityManager(new FluidEntityFactory(), entityProxyFactory);
    const systemOrchestrator = new FluidSystemOrchestrator();
    componentTypeRegistryHookDispatcher.addHook(componentTypeFactory);
    componentRepositoryHookDispatcher.addHook(entityArchetypeCoordinator);
    nodeSchemaRegistryHookDispatcher.addHook(nodeSchemaIndex);
    entityArchetypeHookDispatcher.addHook(nodeManager);
    const core = new FluidCore(entityManager, componentManager, systemOrchestrator, nodeManager);
    return core;
  }
  static isFluidCore(core) {
    return core[FLUID_CORE_SYMBOL] === true;
  }
  static {
    Object.defineProperty(FluidCore.prototype, FLUID_CORE_SYMBOL, {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  constructor(entityManager, componentManager, systemOrchestrator, nodeManager) {
    this.entityManager = entityManager;
    this.componentManager = componentManager;
    this.systemOrchestrator = systemOrchestrator;
    this.nodeManager = nodeManager;
  }
  update() {
    this.systemOrchestrator.update(this.getNodeManager().getNodeIndex());
  }
  getEntityManager() {
    return this.entityManager;
  }
  getComponentManager() {
    return this.componentManager;
  }
  getSystemOrchestrator() {
    return this.systemOrchestrator;
  }
  getNodeManager() {
    return this.nodeManager;
  }
}
var FluidInternal;
(function(FluidInternal2) {
  function initialize(core2) {
    CoreRuntime.initialize(core2);
    return core2;
  }
  FluidInternal2.initialize = initialize;
  function bootstrap() {
    return FluidInternal2.initialize(FluidCore.bootstrap());
  }
  FluidInternal2.bootstrap = bootstrap;
  function core() {
    return CoreRuntime.getInstance();
  }
  FluidInternal2.core = core;
  function defineComponentType(name) {
    const componentManager = FluidInternal2.core().getComponentManager();
    const componentType = componentManager.getComponentTypeFactory().createComponentType(name);
    componentManager.getComponentTypeRegistry().addComponentType(componentType);
    return componentType;
  }
  FluidInternal2.defineComponentType = defineComponentType;
  function registerNodeSchema(nodeSchema, name) {
    return FluidInternal2.core().getNodeManager().getNodeSchemaRegistry().addSchema(nodeSchema, name);
  }
  FluidInternal2.registerNodeSchema = registerNodeSchema;
  function getEntityProxy(entityId) {
    return FluidInternal2.core().getEntityManager().getEntityProxy(entityId);
  }
  FluidInternal2.getEntityProxy = getEntityProxy;
  function removeEntity(entityId) {
    FluidInternal2.core().getEntityManager().removeEntity(entityId);
    FluidInternal2.core().getComponentManager().getComponentRepository().removeEntityComponents(entityId);
  }
  FluidInternal2.removeEntity = removeEntity;
  function addEntityComponent(entityId, component) {
    FluidInternal2.core().getComponentManager().getComponentRepository().addComponent(component, entityId);
  }
  FluidInternal2.addEntityComponent = addEntityComponent;
  function addEntityComponents(entityId, ...components) {
    const componentRepo = FluidInternal2.core().getComponentManager().getComponentRepository();
    for (const component of components) {
      componentRepo.addComponent(component, entityId);
    }
  }
  FluidInternal2.addEntityComponents = addEntityComponents;
  function createEntityWithComponents(...components) {
    const entityId = FluidInternal2.core().getEntityManager().createEntity();
    FluidInternal2.addEntityComponents(entityId, ...components);
    return entityId;
  }
  FluidInternal2.createEntityWithComponents = createEntityWithComponents;
})(FluidInternal || (FluidInternal = {}));
const fluidInternal = FluidInternal;
const floor = Math.floor;
var ChunkState;
(function(ChunkState2) {
  ChunkState2[ChunkState2["Loaded"] = 1] = "Loaded";
  ChunkState2[ChunkState2["Unloaded"] = 2] = "Unloaded";
})(ChunkState || (ChunkState = {}));
function isChunkState(value) {
  return value === ChunkState.Loaded || value === ChunkState.Unloaded;
}
function createChunk(indexOrKey, size, state, { lastAccessed = 0, entitySymbolSet = /* @__PURE__ */ new Set() } = {}) {
  let key;
  let index;
  if (typeof indexOrKey === "string") {
    index = parseChunkKey(indexOrKey);
    key = indexOrKey;
  } else if (Array.isArray(indexOrKey) && indexOrKey.length === 2 && typeof indexOrKey[0] === "number" && typeof indexOrKey[1] === "number") {
    index = indexOrKey;
    key = getChunkKeyFromIndex(indexOrKey[0], indexOrKey[1]);
  } else {
    throw new Error(`Invalid chunk parameters: expected chunk index [i,j] or key "i,j".
	Received value: ${JSON.stringify(indexOrKey)}`);
  }
  if (!isChunkState(state)) {
    throw new Error(`Invalid chunk parameters: expected chunk state ('${ChunkState.Loaded}' or '${ChunkState.Unloaded}')
	Received value:${state}`);
  }
  return {
    index,
    key,
    state,
    lastAccessed,
    entitySymbolSet,
    size
  };
}
function getChunkIndexFromPosition(pos, chunkSize) {
  return [floor(pos.x / chunkSize), floor(pos.y / chunkSize)];
}
function getChunkCornerFromIndex(i, j, chunkSize) {
  return { x: i * chunkSize, y: j * chunkSize };
}
function getChunkCenterFromIndex(i, j, chunkSize) {
  return { x: (i + 0.5) * chunkSize, y: (j + 0.5) * chunkSize };
}
function parseChunkKey(key, silent = false) {
  if (typeof key !== "string") {
    if (silent)
      return void 0;
    throw new Error(`Invalid chunk key: expected a type of "string"
	type:${typeof key}`);
  }
  const parts = key.split(",");
  if (parts.length !== 2) {
    if (silent)
      return void 0;
    throw new Error(`Invalid chunk key format: expected "x,y"
	value:"${key}"`);
  }
  const i = parseInt(parts[0], 10);
  const j = parseInt(parts[1], 10);
  if (isNaN(i) || isNaN(j)) {
    if (silent)
      return void 0;
    throw new Error(`Invalid chunk key indices: "${key}" does not contain valid integers`);
  }
  return [i, j];
}
function getChunkKeyFromIndex(i, j) {
  return `${i},${j}`;
}
async function main() {
  console.log(`Launcher has started!`);
  try {
    console.log("Bootstrapping Fluid Core...");
    const coreInstance = fluidInternal.bootstrap();
    console.log(`Fluid Core has been initialized!`, coreInstance);
  } catch (err) {
    console.error("Fluid Core initialization failed:", err);
    return;
  }
  try {
    console.log("Starting Asteroid Journey...");
    await __vitePreload(() => import("./AsteroidJourney-Bi0BmP__.js"), true ? [] : void 0);
  } catch (err) {
    console.error("Failed to load AsteroidJourney module:", err);
  }
}
await main();
export {
  CoreRuntime as C,
  FluidCore as F,
  OrderedArrayList as O,
  getChunkKeyFromIndex as a,
  ChunkState as b,
  getChunkCornerFromIndex as c,
  getChunkCenterFromIndex as d,
  createChunk as e,
  fluidInternal as f,
  getChunkIndexFromPosition as g,
  parseChunkKey as p
};
